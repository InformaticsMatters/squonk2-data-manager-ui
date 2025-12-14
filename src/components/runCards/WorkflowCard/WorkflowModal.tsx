import { useEffect, useMemo, useRef, useState } from "react";

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
  initialName?: string;
  initialDebug?: DebugValue;
  initialVariables?: Record<string, unknown> | string;
}

const normaliseDebug = (debug?: DebugValue): DebugValue => (debug === "debug" ? "debug" : "0");

const parseInitialVariables = (
  initialVariables?: Record<string, unknown> | string,
): Record<string, unknown> | undefined => {
  if (initialVariables === undefined) {
    return undefined;
  }

  if (typeof initialVariables === "string") {
    try {
      return JSON.parse(initialVariables) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }

  return typeof initialVariables === "object" && !Array.isArray(initialVariables)
    ? initialVariables
    : undefined;
};

/**
 * Modal for running a workflow instance. Fetches workflow details and displays the correct form.
 */
export const WorkflowModal = ({
  workflowId,
  projectId,
  open,
  onClose,
  onLaunch,
  initialName,
  initialDebug,
  initialVariables,
}: WorkflowModalProps) => {
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const { data: workflow } = useGetWorkflow(workflowId);
  const specVariables = workflow?.variables;

  const parsedInitialVariables = useMemo(
    () => parseInitialVariables(initialVariables),
    [initialVariables],
  );

  const [nameState, setNameState] = useState(initialName ?? "");

  useEffect(() => {
    if (!initialName && workflow?.workflow_name) {
      setNameState(workflow.workflow_name);
    }
  }, [initialName, workflow?.workflow_name]);

  const [debug, setDebug] = useState<DebugValue>(normaliseDebug(initialDebug));

  const [inputsData, setInputsData] = useState<InputData>({});
  const [optionsFormData, setOptionsFormData] = useState(parsedInitialVariables ?? specVariables);

  useEffect(() => {
    if (!parsedInitialVariables && specVariables) {
      setOptionsFormData(specVariables);
    }
  }, [parsedInitialVariables, specVariables]);

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
        onLaunch?.(id);
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
          specVariables={parsedInitialVariables ?? specVariables}
        />
      )}
    </ModalWrapper>
  );
};
