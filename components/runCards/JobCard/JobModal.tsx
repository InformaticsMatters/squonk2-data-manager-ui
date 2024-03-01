import { useEffect, useMemo, useRef, useState } from "react";

import type {
  DmError,
  InstanceGetResponse,
  InstanceSummary,
  JobSummary,
} from "@squonk/data-manager-client";
import { getGetInstancesQueryKey, useCreateInstance } from "@squonk/data-manager-client/instance";
import { useGetJob } from "@squonk/data-manager-client/job";

import { Box, Grid, TextField, Typography } from "@mui/material";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { CenterLoader } from "../../CenterLoader";
import { ModalWrapper } from "../../modals/ModalWrapper";
import type { DebugValue } from "../DebugCheckbox";
import { DebugCheckbox } from "../DebugCheckbox";
import type { CommonModalProps } from "../types";
import type { InputSchema, JobInputFieldsProps } from "./JobInputFields";

const JobInputFields = dynamic<JobInputFieldsProps>(
  () => import("./JobInputFields").then((mod) => mod.JobInputFields),
  { loading: () => <CenterLoader /> },
);

export type InputData = Record<string, string | string[] | undefined>;

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: { [key: string]: string | string[] };
}

export interface JobModalProps extends CommonModalProps {
  /**
   * ID of the job to instantiate
   */
  jobId: JobSummary["id"];
  /**
   * An existing instance of this job from which fields take their default values.
   * Allows loading form values from a previous instance
   */
  instance?: InstanceSummary | InstanceGetResponse;
}

const validateJobInputs = (required: string[], inputsData: InputData) => {
  const inputsDataIsValid = Object.values(inputsData)
    .map((inputValue) => {
      if (inputValue === undefined) {
        return false;
      }
      if (Array.isArray(inputValue)) {
        return inputValue.every((v) => v !== "");
      }
      return inputValue.split("\n").every((v) => v !== "");
    })
    .every((v) => v);

  const inputKeys = new Set(Object.keys(inputsData));
  const haveRequiredInputs = required.map((key) => inputKeys.has(key)).every((v) => v);
  return inputsDataIsValid && haveRequiredInputs;
};

/**
 * Modal with options to create a new instance if a job. An instance can be passed to inherit
 * default values.
 */
export const JobModal = ({
  jobId,
  projectId,
  instance,
  open,
  onClose,
  onLaunch,
}: JobModalProps) => {
  // ? Can we guarantee every job has a parsable spec?

  const queryClient = useQueryClient();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const [nameState, setNameState] = useState(instance?.name ?? "");
  const [debug, setDebug] = useState<DebugValue>("0");

  const { mutateAsync: createInstance } = useCreateInstance();
  // Get extra details about the job
  const { data: job } = useGetJob(jobId);

  const name = nameState || (job?.job ?? "");

  const spec = instance?.application_specification;
  const specVariables = useMemo(
    () =>
      spec !== undefined
        ? (JSON.parse(spec).variables as Record<string, string | string[] | undefined>)
        : undefined,
    [spec],
  );

  // Control for generated options form
  const [optionsFormData, setOptionsFormData] = useState<any>(specVariables);

  // Control for the inputs fields

  const inputsDefault = useMemo(() => {
    // Parse the inputs schema which is untyped
    const inputs = job?.variables?.inputs as InputSchema | undefined; // TODO: should validate this with zod
    // Access the default values and use them for the "initial" values for state
    return Object.entries(inputs?.properties ?? {})
      .filter(([, schema]) => schema.default !== undefined)
      .map(([key, { default: defaultValue }]) => [key, defaultValue as string] as const);
  }, [job]);

  const [inputsData, setInputsData] = useState<InputData>({});

  const inputsValid = validateJobInputs(
    (job?.variables?.inputs as InputSchema | undefined)?.required ?? [],
    Object.keys(inputsData).length > 0 ? inputsData : specVariables ?? {},
  );

  const formRef = useRef<any>();

  // Since the default value are obtained async, we have to wait for them to arrive in order to set
  useEffect(() => {
    setInputsData(Object.fromEntries(inputsDefault));
  }, [inputsDefault]);

  const handleSubmit = async () => {
    if (projectId && job) {
      // Construct the specification
      const specification: JobSpecification = {
        collection: job.collection,
        job: job.job,
        version: job.version,
        variables: { ...optionsFormData, ...inputsData },
      };
      try {
        await createInstance({
          data: {
            debug,
            application_id: job.application.application_id,
            // application_version: job.application.latest_version,
            as_name: name,
            project_id: projectId,
            specification: JSON.stringify(specification),
          },
        });
        await queryClient.invalidateQueries({
          queryKey: getGetInstancesQueryKey({ project_id: projectId }),
        });
      } catch (error) {
        enqueueError(error);
      } finally {
        onLaunch && onLaunch();
        onClose();
      }
    } else {
      enqueueSnackbar("No project provided", { variant: "warning" });
    }
  };

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`job-${jobId}`}
      open={open}
      submitDisabled={!formRef.current?.validateForm() || !inputsValid}
      submitText="Run"
      title={job?.name ?? "Run Job"}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {job !== undefined && projectId !== undefined ? (
        <>
          <Box paddingTop={1}>
            <TextField
              fullWidth
              label="Job name"
              value={name} // Give a default instance name of job.job
              onChange={(event) => setNameState(event.target.value)}
            />
          </Box>

          <DebugCheckbox value={debug} onChange={(debug) => setDebug(debug)} />
          {job.variables && (
            <Grid container spacing={2}>
              {job.variables.inputs && (
                <>
                  <Grid item xs={12}>
                    <Typography component="h3" fontWeight="bold" variant="subtitle1">
                      Inputs
                    </Typography>
                  </Grid>
                  <JobInputFields
                    initialValues={specVariables}
                    inputs={job.variables.inputs as any} // TODO: should validate this with zod
                    inputsData={inputsData}
                    projectId={projectId}
                    onChange={setInputsData}
                  />
                </>
              )}

              <Grid item xs={12}>
                {job.variables.options && (
                  <>
                    <Typography component="h3" fontWeight="bold" variant="subtitle1">
                      Options
                    </Typography>
                    <Form
                      liveValidate
                      noHtml5Validate
                      formData={optionsFormData}
                      ref={formRef}
                      schema={job.variables.options} // TODO: should validate this with zod
                      showErrorList="bottom"
                      uiSchema={{ "ui:order": job.variables.order?.options }}
                      validator={validator}
                      onChange={(event) => setOptionsFormData(event.formData)}
                    >
                      {/* Remove the default submit button */}
                      <div />
                    </Form>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </>
      ) : (
        <CenterLoader />
      )}
    </ModalWrapper>
  );
};
