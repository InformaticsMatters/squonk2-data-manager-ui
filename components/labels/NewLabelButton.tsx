import { useQueryClient } from "react-query";

import type { DmError } from "@squonk/data-manager-client";
import { getGetDatasetsQueryKey } from "@squonk/data-manager-client/dataset";
import { useAddMetadata } from "@squonk/data-manager-client/metadata";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import { Box, Button, IconButton, Popover, Tooltip } from "@mui/material";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-mui";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import * as yup from "yup";

import type { TableDataset } from "../../features/DatasetsTable";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { LowerCaseTextField } from "../LowerCaseTextField";

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
        <Formik
          validateOnMount
          initialValues={{ label: "", value: "" }}
          validationSchema={yup.object().shape({
            label: yup.string().trim().required("A label name is required"),
          })}
          onSubmit={async ({ label, value }) => {
            try {
              await addAnnotations({
                datasetId,
                data: {
                  labels: JSON.stringify([
                    {
                      type: "LabelAnnotation",
                      label: label.trim().toLowerCase(),
                      value: value.trim(),
                      active: true,
                    },
                  ]),
                },
              });
              await queryClient.invalidateQueries(getGetDatasetsQueryKey());
            } catch (error) {
              enqueueError(error);
            } finally {
              popupState.close();
            }
          }}
        >
          {({ submitForm, isSubmitting, isValid }) => (
            <Form>
              <Box alignItems="baseline" display="flex" gap={(theme) => theme.spacing(1)}>
                <Field autoFocus component={LowerCaseTextField} label="Name" name="label" />
                <Field component={TextField} label="Value" name="value" />
                <Button disabled={isSubmitting || !isValid} onClick={submitForm}>
                  Add
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Popover>
    </>
  );
};
