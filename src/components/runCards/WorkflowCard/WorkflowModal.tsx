import { useEffect, useRef, useState } from "react";

import { useGetWorkflow } from "@/api/data-manager/workflow";

import { Box, TextField, Typography } from "@mui/material";

import { capabilityIsEnabled } from "../../../projects/capabilities";
import { launchIsSendable } from "../../../projects/runLaunch";
import { useRunCommands } from "../../../projects/useRunCommands";
import { useRunLaunch } from "../../../projects/useRunLaunch";
import { CenterLoader } from "../../CenterLoader";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { CapabilityReasons } from "../../results/CapabilityReasons";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { JobInputsAndOptionsForm } from "../JobCard/JobInputsAndOptionsForm";
import { type InputData } from "../JobCard/JobModal";
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
  const specVariables = workflow?.variables;

  const [nameState, setNameState] = useState("");

  useEffect(() => {
    workflow?.workflow_name && setNameState(workflow.workflow_name);
  }, [workflow?.workflow_name]);

  const [debug, setDebug] = useState<DebugValue>("0");

  const [inputsData, setInputsData] = useState<InputData>({});
  const [optionsFormData, setOptionsFormData] = useState(specVariables);

  const formRef = useRef<any>(null);

  const { launchWorkflow } = useRunCommands();
  const { attempt, launch } = useRunLaunch(onLaunched);

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
        variables: JSON.stringify({ ...optionsFormData, ...inputsData }),
      }),
    );
  };

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`workflow-${workflowId}`}
      open={open}
      submitDisabled={!capabilityIsEnabled(capabilities.launch) || !launchIsSendable(attempt)}
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
              label="Workflow name"
              value={nameState}
              onChange={(event) => setNameState(event.target.value)}
            />
          </Box>

          <DebugCheckbox value={debug} onChange={(debug) => setDebug(debug)} />
          <JobInputsAndOptionsForm
            formRef={formRef}
            inputs={specVariables?.inputs}
            inputsData={inputsData}
            options={specVariables?.options}
            optionsFormData={optionsFormData}
            order={(specVariables?.options as any)?.properties}
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
