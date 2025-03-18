import { useState } from "react";

import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import { Box, IconButton, type IconButtonProps, TextField, Tooltip } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { FormModalWrapper } from "../../../components/modals/FormModalWrapper";
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
  const { handleMove } = useMoveProjectObject(projectId, path, type, () => setOpen(false));

  // Define validation schema
  const schema = z.object({
    dstPath: z
      .string()
      .min(1, "A destination path is required")
      .max(255, "Path cannot exceed 255 characters")
      .refine((val) => PATH_PATTERN.test(val), {
        message: "The path is invalid. It should not start or end with a slash.",
      }),
  });

  const form = useForm({
    defaultValues: {
      dstPath: path,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({ value }) => {
      handleMove(value.dstPath, { onSettled: () => form.reset() });
      return {};
    },
  });

  const formWrapper = {
    handleSubmit: () => form.handleSubmit(),
    reset: () => form.reset(),
    state: {
      canSubmit: form.state.canSubmit,
      isSubmitting: form.state.isSubmitting,
    },
  };

  return (
    <>
      <Tooltip title="Rename / Move">
        <IconButton {...buttonProps} size="small" onClick={() => setOpen(true)}>
          <DriveFileRenameOutlineRoundedIcon />
        </IconButton>
      </Tooltip>
      <FormModalWrapper
        form={formWrapper}
        id={`rename-${path}`}
        open={open}
        submitText="Rename / Move"
        title="Rename / Move"
        onClose={() => setOpen(false)}
      >
        <Box sx={{ p: 1 }}>
          <form.Field name="dstPath">
            {(field) => (
              <TextField
                autoFocus
                fullWidth
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors[0]?.message ?? ""}
                label="Destination Path"
                sx={{ "& input": { width: "100vw" } }}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>
        </Box>
      </FormModalWrapper>
    </>
  );
};
