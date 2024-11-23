import { useState } from "react";

import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import { Box, IconButton, type IconButtonProps, Tooltip } from "@mui/material";
import { Field } from "formik";
import { TextField } from "formik-mui";
import * as yup from "yup";

import { FormikModalWrapper } from "../../../components/modals/FormikModalWrapper";
import {
  PATH_PATTERN,
  type ProjectObject,
  useMoveProjectObject,
} from "../../../hooks/api/useMoveProjectObject";

// removed type from IconButtonProps as it's also defined there
export interface RenameButtonProps extends Omit<IconButtonProps, "type"> {
  projectId: string;
  type: ProjectObject;
  path: string;
}

export const RenameButton = ({ projectId, type, path, ...buttonProps }: RenameButtonProps) => {
  const [open, setOpen] = useState(false);
  const initialValues = {
    dstPath: path,
  };

  const { handleMove } = useMoveProjectObject(projectId, path, type, () => setOpen(false));

  return (
    <>
      <Tooltip title="Rename / Move">
        <IconButton {...buttonProps} size="small" onClick={() => setOpen(true)}>
          <DriveFileRenameOutlineRoundedIcon />
        </IconButton>
      </Tooltip>
      <FormikModalWrapper
        id={`rename-${path}`}
        initialValues={initialValues}
        open={open}
        submitText="Rename / Move"
        title="Rename / Move"
        validationSchema={yup.object().shape({
          dstPath: yup
            .string()
            .matches(PATH_PATTERN, "The path is invalid. It should not start or end with a slash.")
            .trim()
            .required("A destination path is required")
            .max(255),
        })}
        onClose={() => setOpen(false)}
        onSubmit={({ dstPath }, { resetForm }) => {
          handleMove(dstPath, { onSettled: () => resetForm() });
        }}
      >
        <Box sx={{ p: 1 }}>
          <Field
            autoFocus
            fullWidth
            component={TextField}
            label="Destination Path"
            name="dstPath"
            sx={{ "& input": { width: "100vw" } }}
          />
        </Box>
      </FormikModalWrapper>
    </>
  );
};
