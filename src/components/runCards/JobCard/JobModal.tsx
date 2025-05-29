import { useEffect, useMemo, useRef, useState } from "react";

import {
  type DmError,
  type InstanceGetResponse,
  type InstanceSummary,
  type JobSummary,
} from "@squonk/data-manager-client";
import { getGetInstancesQueryKey, useCreateInstance } from "@squonk/data-manager-client/instance";
import { useGetJob } from "@squonk/data-manager-client/job";

import { Box, TextField } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { CenterLoader } from "../../CenterLoader";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { TEST_JOB_ID } from "../TestJob/jobId";
import { type CommonModalProps } from "../types";
import { type InputSchema, validateInputData } from "./JobInputFields";
import { JobInputsAndOptionsForm } from "./JobInputsAndOptionsForm";

export type InputData = Record<string, string[] | string | undefined>;

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: Record<string, string[] | string>;
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
  instance?: InstanceGetResponse | InstanceSummary;
}

const validateJobInputs = (required: string[], inputsData: InputData) => {
  const inputsDataIsValid = Object.values(inputsData)
    .map((element) => validateInputData(element))
    .every(Boolean);

  const inputKeys = new Set(Object.keys(inputsData));
  const haveRequiredInputs = required.map((key) => inputKeys.has(key)).every(Boolean);
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

  const [debug, setDebug] = useState<DebugValue>("0");

  const { mutateAsync: createInstance } = useCreateInstance();
  // Get extra details about the job
  const { data: job } = useGetJob(jobId, undefined, {
    query: { retry: jobId === TEST_JOB_ID ? 1 : 3 },
  });
  const [nameState, setNameState] = useState(instance?.name ?? "");
  useEffect(() => {
    job?.name && setNameState(job.name);
  }, [job?.name]);

  const spec = instance?.application_specification;
  const specVariables = useMemo(
    () =>
      spec === undefined
        ? undefined
        : (JSON.parse(spec).variables as Record<string, string[] | string | undefined>),
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

  const inputKeys = Object.keys(job?.variables?.inputs?.properties ?? {});
  const specInputs = Object.fromEntries(
    Object.entries(specVariables ?? {}).filter(([key, _]) => inputKeys.includes(key)),
  );

  const inputsValid = validateJobInputs(
    (job?.variables?.inputs as InputSchema | undefined)?.required ?? [],
    Object.keys(inputsData).length > 0 ? inputsData : specInputs,
  );

  const formRef = useRef<any>(null);

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
        const { instance_id: instanceId } = await createInstance({
          data: {
            debug,
            application_id: job.application.application_id,
            // application_version: job.application.latest_version,
            as_name: nameState,
            project_id: projectId,
            specification: JSON.stringify(specification),
          },
        });
        onLaunch && onLaunch(instanceId);
        await queryClient.invalidateQueries({
          queryKey: getGetInstancesQueryKey({ project_id: projectId }),
        });
      } catch (error) {
        enqueueError(error);
      } finally {
        onClose();
      }
    } else {
      enqueueSnackbar("No project provided", { variant: "warning" });
    }
  };

  const variables = job?.variables;

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`job-${jobId}`}
      open={open}
      submitDisabled={!inputsValid}
      submitText="Run"
      title={job?.name ?? "Run Job"}
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
    >
      {job !== undefined && projectId !== undefined ? (
        <>
          <Box sx={{ paddingTop: 1 }}>
            <TextField
              fullWidth
              label="Job name"
              value={nameState} // Give a default instance name of job.job
              onChange={(event) => setNameState(event.target.value)}
            />
          </Box>

          <DebugCheckbox value={debug} onChange={(debug) => setDebug(debug)} />
          <JobInputsAndOptionsForm
            formRef={formRef}
            inputs={variables?.inputs}
            inputsData={inputsData}
            options={variables?.options}
            optionsFormData={optionsFormData}
            order={variables?.order?.options ?? []}
            projectId={projectId}
            setInputsData={setInputsData}
            setOptionsFormData={setOptionsFormData}
            specVariables={specVariables}
          />
        </>
      ) : (
        <CenterLoader />
      )}
    </ModalWrapper>
  );
};
