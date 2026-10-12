import { useMemo, useRef, useState } from "react";

import { type RunningWorkflowGetResponse } from "@/api/data-manager";
import { useGetWorkflow } from "@/api/data-manager/workflow";

import { Box, TextField, Typography } from "@mui/material";

import { useStateResetOn } from "../../../hooks/useStateResetOn";
import { capabilityIsEnabled } from "../../../projects/capabilities";
import { launchIsSendable } from "../../../projects/runLaunch";
import {
  launchNameDefault,
  launchNameProblem,
  readRunDefinitionVariables,
} from "../../../projects/runLaunchForm";
import { useRunCommands } from "../../../projects/useRunCommands";
import { useRunLaunch } from "../../../projects/useRunLaunch";
import { CenterLoader } from "../../CenterLoader";
import { RunIcon } from "../../icons";
import { DefinitionKindIcon } from "../../kindIcons";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { CapabilityReasons } from "../../results/CapabilityReasons";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { JobInputsAndOptionsForm } from "../JobCard/JobInputsAndOptionsForm";
import { LaunchFeedback } from "../LaunchFeedback";
import { type RunModalProps } from "../types";
import { useLaunchForm } from "../useLaunchForm";

export interface WorkflowModalProps extends RunModalProps {
  workflowId: string;
  /**
   * An earlier run of this workflow from which fields take their default values, so running it
   * again starts from exactly what that run was launched with.
   */
  runningWorkflow?: Pick<RunningWorkflowGetResponse, "name" | "variables">;
}

/**
 * Modal for running a workflow in the project the URL addresses. Fetches the workflow definition
 * and displays the form its variables describe. A running workflow can be passed to inherit
 * default values.
 */
export const WorkflowModal = ({
  capabilities,
  workflowId,
  runningWorkflow,
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

  // The name the inherited run was launched under, and only where there is none the workflow's own
  // name once the definition answers.
  const [nameState, setNameState] = useStateResetOn(workflow?.workflow_name, (workflowName) =>
    launchNameDefault(runningWorkflow?.name, workflowName),
  );

  const [debug, setDebug] = useState<DebugValue>("0");

  // The definition arrives after the form is first drawn, so its own declared defaults are entered
  // once it does. A workflow that declares a default for an input it requires is therefore ready to
  // run as opened, exactly as the same workflow expressed as a job would be.
  const {
    inputsData,
    inputsSupplied,
    optionsFormData,
    setInputsData,
    setOptionsFormData,
    variables,
  } = useLaunchForm(declared, runningWorkflow?.variables);

  const formRef = useRef<any>(null);

  const { launchWorkflow } = useRunCommands();
  const { attempt, launch } = useRunLaunch(onLaunched);

  // A launch missing an input the workflow requires, or carrying a name the Data Manager's own run
  // contract will not accept, can only be answered with a refusal, so it is explained here instead
  // of being sent to earn one.
  const nameProblem = launchNameProblem(nameState);
  const launchIsComplete = nameProblem === undefined && inputsSupplied;

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
        variables: JSON.stringify(variables()),
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
      submitIcon={<RunIcon />}
      submitText="Run"
      title={workflow?.workflow_name ?? workflow?.name ?? "Run workflow"}
      titleIcon={<DefinitionKindIcon kind="workflow" />}
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
            specVariables={runningWorkflow?.variables}
          />
        </>
      )}
    </ModalWrapper>
  );
};
