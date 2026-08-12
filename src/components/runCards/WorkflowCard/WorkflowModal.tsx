import { useEffect, useMemo, useRef, useState } from "react";

import { useGetWorkflow } from "@/api/data-manager/workflow";

import { Box, TextField, Typography } from "@mui/material";

import { capabilityIsEnabled } from "../../../projects/capabilities";
import { launchIsSendable } from "../../../projects/runLaunch";
import {
  declaredInputDefaults,
  type InputData,
  launchVariables,
  readRunDefinitionVariables,
  runInputsAreSupplied,
  workflowLaunchNameProblem,
} from "../../../projects/runLaunchForm";
import { useRunCommands } from "../../../projects/useRunCommands";
import { useRunLaunch } from "../../../projects/useRunLaunch";
import { CenterLoader } from "../../CenterLoader";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { CapabilityReasons } from "../../results/CapabilityReasons";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { JobInputsAndOptionsForm } from "../JobCard/JobInputsAndOptionsForm";
import { LaunchFeedback } from "../LaunchFeedback";
import { type RunModalProps } from "../types";

export interface WorkflowModalProps extends RunModalProps {
  workflowId: string;
}

/**
 * Modal for running a workflow in the project the URL addresses. Fetches the workflow definition
 * and displays the form its variables describe.
 */
export const WorkflowModal = ({
  capabilities,
  workflowId,
  projectId,
  open,
  onClose,
  onLaunched,
}: WorkflowModalProps) => {
  const { data: workflow } = useGetWorkflow(workflowId);
  // What this workflow declares its launch needs, read the one way every definition's variables
  // are. The declared blocks describe the form's fields and are never the values it sends.
  const declared = useMemo(
    () => readRunDefinitionVariables(workflow?.variables),
    [workflow?.variables],
  );

  const [nameState, setNameState] = useState("");

  useEffect(() => {
    workflow?.workflow_name && setNameState(workflow.workflow_name);
  }, [workflow?.workflow_name]);

  const [debug, setDebug] = useState<DebugValue>("0");

  const [inputsData, setInputsData] = useState<InputData>({});
  const [optionsFormData, setOptionsFormData] = useState<Record<string, unknown>>();

  // The definition arrives after the form is first drawn, so its own declared defaults are entered
  // once it does. A workflow that declares a default for an input it requires is therefore ready to
  // run as opened, exactly as the same workflow expressed as a job would be.
  const inputsDefault = useMemo(() => declaredInputDefaults(declared.inputs), [declared]);

  useEffect(() => {
    setInputsData(inputsDefault);
  }, [inputsDefault]);

  const formRef = useRef<any>(null);

  const { launchWorkflow } = useRunCommands();
  const { attempt, launch } = useRunLaunch(onLaunched);

  // A launch missing an input the workflow requires, or carrying a name the Data Manager's own run
  // contract will not accept, can only be answered with a refusal, so it is explained here instead
  // of being sent to earn one.
  const nameProblem = workflowLaunchNameProblem(nameState);
  const launchIsComplete =
    nameProblem === undefined && runInputsAreSupplied(declared.inputs, inputsData);

  // The launch names the project the URL addresses and nothing else, so a workflow can only ever be
  // run in the project the caller is looking at.
  const handleLaunch = () => {
    if (!workflow?.id) {
      return;
    }
    void launch(() =>
      launchWorkflow(projectId, workflow.id, {
        debug,
        name: nameState,
        variables: JSON.stringify(launchVariables(optionsFormData, inputsData)),
      }),
    );
  };

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`workflow-${workflowId}`}
      open={open}
      submitDisabled={
        !capabilityIsEnabled(capabilities.launch) || !launchIsComplete || !launchIsSendable(attempt)
      }
      submitText="Run"
      title={workflow?.workflow_name ?? workflow?.name ?? "Run workflow"}
      onClose={onClose}
      onSubmit={handleLaunch}
    >
      {workflow === undefined ? (
        <CenterLoader />
      ) : (
        <>
          <Typography
            sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}
            variant="caption"
          >
            Workflow
          </Typography>
          <Typography variant="body2">
            {workflow.workflow_description ?? <em>No description</em>}
          </Typography>
          <CapabilityReasons capabilities={[capabilities.launch, capabilities.availability]} />
          <LaunchFeedback attempt={attempt} />
          <Box sx={{ paddingTop: 1 }}>
            <TextField
              fullWidth
              error={nameProblem !== undefined}
              helperText={nameProblem}
              label="Workflow name"
              value={nameState}
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
          />
        </>
      )}
    </ModalWrapper>
  );
};
