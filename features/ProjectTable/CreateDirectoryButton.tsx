import { useState } from "react";

import { useCreatePath } from "@squonk/data-manager-client/file-and-path";

import { CreateNewFolderRounded as CreateNewFolderRoundedIcon } from "@mui/icons-material";
import { Box, Button, IconButton, Paper, Popover, TextField, Tooltip } from "@mui/material";
import { bindPopover, bindToggle, usePopupState } from "material-ui-popup-state/hooks";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";

export interface CreateDirectoryButtonProps {
  path: string;
  directories: string[];
  onDirectoryCreated: () => Promise<void>;
}

export const CreateDirectoryButton = ({
  path,
  directories,
  onDirectoryCreated,
}: CreateDirectoryButtonProps) => {
  const popupState = usePopupState({ variant: "popover", popupId: "create-dir" });

  const [directoryName, setDirectoryName] = useState("");
  const isValid = !directories.includes(directoryName);

  const { mutateAsync: createPath } = useCreatePath();

  const { projectId } = useCurrentProjectId();

  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const [isCreating, setIsCreating] = useState(false);
  const createDirectory = async () => {
    if (projectId) {
      try {
        setIsCreating(true);
        await createPath({
          params: {
            path: path === "/" ? `/${directoryName}` : `${path}/${directoryName}`,
            project_id: projectId,
          },
        });
        await onDirectoryCreated();
        enqueueSnackbar("Directory created", { variant: "success" });
      } catch (error) {
        enqueueError(error);
      } finally {
        setIsCreating(false);
        setDirectoryName("");
        popupState.close();
      }
    }
  };

  return (
    <>
      <Tooltip title="Create directory">
        <IconButton size="large" {...bindToggle(popupState)}>
          <CreateNewFolderRoundedIcon />
        </IconButton>
      </Tooltip>
      <Popover
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        {...bindPopover(popupState)}
      >
        <Paper>
          <Box p={1}>
            <TextField
              autoFocus
              error={!isValid}
              helperText={!isValid ? "Directory already exists" : undefined}
              label="Directory Name"
              value={directoryName}
              onChange={(event) => setDirectoryName(event.target.value)}
            />
            <Button disabled={isCreating || !isValid} onClick={createDirectory}>
              Create
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};
