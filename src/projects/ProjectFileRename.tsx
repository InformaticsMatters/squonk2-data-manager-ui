import { useState } from "react";

import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import { Box, TextField } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/mini";

import { FormModalWrapper } from "../components/modals/FormModalWrapper";
import { type ProjectCapability } from "./capabilities";
import { CapabilityIconButton } from "./CapabilityIconButton";
import { relativePathPattern } from "./fileMutations";
import { useFileCommands } from "./useFileCommands";
import { useFileMutation } from "./useFileMutation";

/**
 * Renames or moves one file or directory of the addressed project. The destination is a
 * project-root relative path, the same spelling every row already carries, so what is typed and
 * what the Data Manager is asked for describe the same item.
 */
export const ProjectFileRename = ({
  capability,
  fullPath,
  projectId,
  type,
}: {
  capability: ProjectCapability;
  fullPath: string;
  projectId: string;
  type: "directory" | "file";
}) => {
  const [open, setOpen] = useState(false);
  const commands = useFileCommands(projectId);
  const { isPending, run } = useFileMutation();

  const schema = z.object({
    destination: z.string().check(
      z.minLength(1, "A destination path is required"),
      z.maxLength(255, "Path cannot exceed 255 characters"),
      z.refine((value) => relativePathPattern.test(value), {
        message: "The path is invalid. It should not start or end with a slash.",
      }),
    ),
  });

  const form = useForm({
    defaultValues: { destination: fullPath },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await run(`rename or move`, `${fullPath} in this project`, () =>
        commands.moveObject(type, fullPath, value.destination),
      );
      setOpen(false);
      return {};
    },
  });

  return (
    <>
      <CapabilityIconButton
        capability={capability}
        size="small"
        title="Rename or move"
        onClick={() => setOpen(true)}
      >
        <DriveFileRenameOutlineRoundedIcon />
      </CapabilityIconButton>
      <FormModalWrapper
        form={{
          handleSubmit: () => form.handleSubmit(),
          reset: () => form.reset(),
          state: { canSubmit: form.state.canSubmit && !isPending, isSubmitting: isPending },
        }}
        id={`rename-${fullPath}`}
        open={open}
        submitText="Rename / Move"
        title="Rename / Move"
        onClose={() => setOpen(false)}
      >
        <Box sx={{ p: 1 }}>
          <form.Field name="destination">
            {(field) => (
              <TextField
                autoFocus
                fullWidth
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors[0]?.message ?? ""}
                label="Destination Path"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </form.Field>
        </Box>
      </FormModalWrapper>
    </>
  );
};
