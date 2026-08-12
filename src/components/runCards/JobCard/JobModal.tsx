import { useEffect, useMemo, useRef, useState } from "react";

import {
  type InstanceGetResponse,
  type InstanceSummary,
  type JobSummary,
} from "@/api/data-manager";
import { useGetJob } from "@/api/data-manager/job";

import { Box, TextField, Typography } from "@mui/material";

import { capabilityIsEnabled } from "../../../projects/capabilities";
import { launchIsSendable } from "../../../projects/runLaunch";
import { useRunCommands } from "../../../projects/useRunCommands";
import { useRunLaunch } from "../../../projects/useRunLaunch";
import { CenterLoader } from "../../CenterLoader";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { CapabilityReasons } from "../../results/CapabilityReasons";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { LaunchFeedback } from "../LaunchFeedback";
import { TEST_JOB_ID } from "../TestJob/jobId";
import { type RunModalProps } from "../types";
import { type InputSchema, validateInputData } from "./JobInputFields";
import { JobInputsAndOptionsForm } from "./JobInputsAndOptionsForm";

export type InputData = Record<string, string[] | string | undefined>;

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: Record<string, string[] | string>;
}

export interface JobModalProps extends RunModalProps {
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
 * Modal with options to create a new instance of a job in the project the URL addresses. An
 * instance can be passed to inherit default values.
 */
export const JobModal = ({
  capabilities,
  jobId,
  projectId,
  instance,
  open,
  onClose,
  onLaunched,
}: JobModalProps) => {
  // ? Can we guarantee every job has a parsable spec?

  const [debug, setDebug] = useState<DebugValue>("0");

  const { launchInstance } = useRunCommands();
  const { attempt, launch } = useRunLaunch(onLaunched);
  // Get extra details about the job
  const { data: job } = useGetJob(jobId, undefined, {
    query: { retry: jobId === TEST_JOB_ID ? 1 : 3 },
  });
  const [nameState, setNameState] = useState(instance?.job_name ?? "");
  useEffect(() => {
    job?.job && setNameState(job.job);
  }, [job?.job]);

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

  // The launch names the project the URL addresses and nothing else, so a job can only ever be run
  // in the project the caller is looking at.
  const handleLaunch = () => {
    if (!job) {
      return;
    }
    const specification: JobSpecification = {
      collection: job.collection,
      job: job.job,
      version: job.version,
      variables: { ...optionsFormData, ...inputsData },
    };
    void launch(() =>
      launchInstance(projectId, {
        applicationId: job.application.application_id,
        debug,
        name: nameState,
        specification: JSON.stringify(specification),
      }),
    );
  };

  const variables = job?.variables;

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`job-${jobId}`}
      open={open}
      submitDisabled={
        !capabilityIsEnabled(capabilities.launch) || !inputsValid || !launchIsSendable(attempt)
      }
      submitText="Run"
      title={job?.name ?? "Run job"}
      onClose={onClose}
      onSubmit={handleLaunch}
    >
      {job === undefined ? (
        <CenterLoader />
      ) : (
        <>
          <Typography
            sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}
            variant="caption"
          >
            Job
          </Typography>
          <Typography variant="body2">
            {job.collection} • version {job.version}
          </Typography>
          <CapabilityReasons capabilities={[capabilities.launch, capabilities.availability]} />
          <LaunchFeedback attempt={attempt} />
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
      )}
    </ModalWrapper>
  );
};
