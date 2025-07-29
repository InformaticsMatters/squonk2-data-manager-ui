import { useEffect, useRef, useState } from "react";

import { type DmError } from "@squonk/data-manager-client";
import { useGetWorkflow, useRunWorkflow } from "@squonk/data-manager-client/workflow";

import { Box, TextField } from "@mui/material";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { JobInputsAndOptionsForm } from "../JobCard/JobInputsAndOptionsForm";
import { type InputData } from "../JobCard/JobModal";

export interface WorkflowModalProps {
  workflowId: string;
  projectId: string;
  open: boolean;
  onClose: () => void;
  onLaunch?: (runningWorkflowId: string) => void;
}

/**
 * Modal for running a workflow instance. Fetches workflow details and displays the correct form.
 */
export const WorkflowModal = ({
  workflowId,
  projectId,
  open,
  onClose,
  onLaunch,
}: WorkflowModalProps) => {
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

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

  const { mutateAsync: runWorkflow } = useRunWorkflow();

  const handleSubmit = async () => {
    try {
      if (workflow?.id) {
        const { id } = await runWorkflow({
          workflowId: workflow.id,
          data: {
            as_name: nameState,
            debug,
            project_id: projectId,
            variables: JSON.stringify({ ...optionsFormData, ...inputsData }),
          },
        });
        enqueueSnackbar("Workflow instance started successfully", { variant: "success" });
        onLaunch && onLaunch(id);
      }
    } catch (error) {
      enqueueError(error);
    } finally {
      onClose();
    }
  };

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`workflow-${workflowId}`}
      open={open}
      submitDisabled={false}
      submitText="Run"
      title={workflow?.name ?? ""}
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
    >
      <Box sx={{ paddingTop: 1 }}>
        <TextField
          fullWidth
          label="Workflow name"
          value={nameState}
          onChange={(event) => setNameState(event.target.value)}
        />
      </Box>

      <DebugCheckbox value={debug} onChange={(debug) => setDebug(debug)} />
      {!!workflow && (
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
      )}
    </ModalWrapper>
  );
};
