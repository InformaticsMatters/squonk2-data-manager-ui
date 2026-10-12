import { useMemo, useRef, useState } from "react";

import {
  type InstanceGetResponse,
  type InstanceSummary,
  type JobSummary,
} from "@/api/data-manager";
import { useGetJob } from "@/api/data-manager/job";

import { Box, TextField, Typography } from "@mui/material";

import { useStateResetOn } from "../../../hooks/useStateResetOn";
import { capabilityIsEnabled } from "../../../projects/capabilities";
import { launchIsSendable } from "../../../projects/runLaunch";
import { launchNameDefault, readRunDefinitionVariables } from "../../../projects/runLaunchForm";
import { useRunCommands } from "../../../projects/useRunCommands";
import { useRunLaunch } from "../../../projects/useRunLaunch";
import { CenterLoader } from "../../CenterLoader";
import { RunIcon } from "../../icons";
import { DefinitionKindIcon } from "../../kindIcons";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { CapabilityReasons } from "../../results/CapabilityReasons";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { LaunchFeedback } from "../LaunchFeedback";
import { TEST_JOB_ID } from "../TestJob/jobId";
import { type RunModalProps } from "../types";
import { useLaunchForm } from "../useLaunchForm";
import { JobInputsAndOptionsForm } from "./JobInputsAndOptionsForm";

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: Record<string, unknown>;
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
  // The name the inherited instance was run under — its own `name`, not the `job_name` the job
  // definition gave it — and only where there is none the job's own identifier once it answers.
  const [nameState, setNameState] = useStateResetOn(job?.job, (jobName) =>
    launchNameDefault(instance?.name, jobName),
  );

  const spec = instance?.application_specification;
  const specVariables = useMemo(
    () =>
      spec === undefined
        ? undefined
        : (JSON.parse(spec).variables as Record<string, string[] | string | undefined>),
    [spec],
  );

  // The declared inputs, options, and option order, read the one way every definition's are.
  const declared = useMemo(() => readRunDefinitionVariables(job?.variables), [job?.variables]);

  const {
    inputsData,
    inputsSupplied: inputsValid,
    optionsFormData,
    setInputsData,
    setOptionsFormData,
    variables,
  } = useLaunchForm(declared, specVariables);

  const formRef = useRef<any>(null);

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
      variables: variables(),
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

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`job-${jobId}`}
      open={open}
      submitDisabled={
        !capabilityIsEnabled(capabilities.launch) || !inputsValid || !launchIsSendable(attempt)
      }
      submitIcon={<RunIcon />}
      submitText="Run"
      title={job?.name ?? "Run job"}
      titleIcon={<DefinitionKindIcon kind="job" />}
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
            inputs={declared.inputs}
            inputsData={inputsData}
            options={declared.options}
            optionsFormData={optionsFormData}
            order={declared.optionOrder}
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
