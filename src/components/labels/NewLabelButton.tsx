import { type DmError } from "@squonk/data-manager-client";
import { getGetDatasetsQueryKey } from "@squonk/data-manager-client/dataset";
import { useAddMetadata } from "@squonk/data-manager-client/metadata";

import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from "@mui/icons-material";
import { Box, Button, IconButton, Popover, TextField, Tooltip } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { z } from "zod";

import { type TableDataset } from "../../features/DatasetsTable";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";

export interface NewLabelButtonProps {
  /**
   * ID of the dataset
   */
  datasetId: TableDataset["dataset_id"];
}

export const NewLabelButton = ({ datasetId }: NewLabelButtonProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAnnotations } = useAddMetadata();
  const { enqueueError } = useEnqueueError<DmError>();

  const popupState = usePopupState({ variant: "popover", popupId: `add-label-${datasetId}` });

  // Define Zod schema for validation
  const labelSchema = z.object({
    label: z.string().trim().min(1, "A label name is required"),
    value: z.string(),
  });

  const form = useForm({
    defaultValues: { label: "", value: "" },
    validators: { onChange: labelSchema },
    onSubmit: async ({ value }) => {
      try {
        await addAnnotations({
          datasetId,
          data: {
            labels: JSON.stringify([
              {
                type: "LabelAnnotation",
                label: value.label.trim().toLowerCase(),
                value: value.value.trim(),
                active: true,
              },
            ]),
          },
        });
        await queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() });
        form.reset();
      } catch (error) {
        enqueueError(error);
      } finally {
        popupState.close();
      }
    },
  });

  return (
    <>
      <Tooltip title="Add a new label">
        <IconButton size="small" {...bindTrigger(popupState)}>
          <AddCircleOutlineRoundedIcon />
        </IconButton>
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
            <Button disabled={!form.state.canSubmit} type="submit">
              Add
            </Button>
          </Box>
        </form>
      </Popover>
    </>
  );
};
