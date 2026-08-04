import { type DmError } from "@/api/data-manager";

import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from "@mui/icons-material";
import { Box, Button, IconButton, Popover, TextField, Tooltip } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { z } from "zod/mini";

import { type DatasetCapability } from "../../datasets/capabilities";
import { datasetMutationFailureMessage } from "../../datasets/mutations";
import { useDatasetCommands } from "../../datasets/useDatasetCommands";
import { type TableDataset } from "../../features/DatasetsTable";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";

export interface NewLabelButtonProps {
  /**
   * ID of the dataset
   */
  datasetId: TableDataset["dataset_id"];
  datasetVersion: number;
  capability: DatasetCapability;
}

export const NewLabelButton = ({ datasetId, datasetVersion, capability }: NewLabelButtonProps) => {
  const { addLabel, isLabelPending } = useDatasetCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const popupState = usePopupState({ variant: "popover", popupId: `add-label-${datasetId}` });

  // Define Zod schema for validation
  const labelSchema = z.object({
    label: z.string().check(z.trim(), z.minLength(1, "A label name is required")),
    value: z.string(),
  });

  const form = useForm({
    defaultValues: { label: "", value: "" },
    validators: { onChange: labelSchema },
    onSubmit: async ({ value }) => {
      try {
        await addLabel(
          datasetId,
          datasetVersion,
          value.label.trim().toLowerCase(),
          value.value.trim(),
        );
        form.reset();
        popupState.close();
      } catch (error) {
        const message = datasetMutationFailureMessage(
          error,
          "change labels for",
          datasetId,
          datasetVersion,
        );
        message ? enqueueSnackbar(message, { variant: "error" }) : enqueueError(error);
      }
    },
  });

  return (
    <>
      <Tooltip title={capability.status === "disabled" ? capability.reason : "Add a new label"}>
        <span>
          <IconButton
            aria-label="Add a new label"
            disabled={capability.status !== "enabled"}
            size="small"
            {...bindTrigger(popupState)}
          >
            <AddCircleOutlineRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        sx={{ "& .MuiPopover-paper": { p: 1 } }}
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
            <form.Field name="label">
              {(field) => (
                <TextField
                  autoFocus
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                  label="Name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                />
              )}
            </form.Field>
            <form.Field name="value">
              {(field) => (
                <TextField
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                  label="Value"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
            <Button disabled={!form.state.canSubmit || isLabelPending} type="submit">
              Add
            </Button>
          </Box>
        </form>
      </Popover>
    </>
  );
};
