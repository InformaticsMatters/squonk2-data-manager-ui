import { useState } from "react";
import { type DropzoneState } from "react-dropzone";

import {
  CloudUploadRounded as CloudUploadRoundedIcon,
  CreateNewFolderRounded as CreateNewFolderRoundedIcon,
} from "@mui/icons-material";
import { Box, Button, Paper, Popover, TextField } from "@mui/material";
import { bindPopover, bindToggle, usePopupState } from "material-ui-popup-state/hooks";

import { capabilityIsEnabled, type ProjectCapability } from "./capabilities";
import { CapabilityIconButton } from "./CapabilityIconButton";
import { useFileCommands } from "./useFileCommands";
import { useFileMutation } from "./useFileMutation";

/**
 * Creates one directory inside the directory Files is displaying. The command decides whether the
 * typed name can be used, so this control never has to work it out and a name already taken is
 * reported rather than sent.
 */
export const CreateDirectoryControl = ({
  capability,
  existing,
  path,
  projectId,
}: {
  capability: ProjectCapability;
  existing: readonly string[];
  path: string;
  projectId: string;
}) => {
  const popupState = usePopupState({ popupId: "create-directory", variant: "popover" });
  const [name, setName] = useState("");
  const commands = useFileCommands(projectId);
  const { isPending, run } = useFileMutation();

  const create = async () => {
    await run("create a directory in", "this project", () =>
      commands.createDirectory(path, name, existing),
    );
    setName("");
    popupState.close();
  };

  return (
    <>
      <CapabilityIconButton
        capability={capability}
        size="large"
        title="Create directory"
        {...bindToggle(popupState)}
      >
        <CreateNewFolderRoundedIcon />
      </CapabilityIconButton>
      <Popover
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        transformOrigin={{ horizontal: "center", vertical: "top" }}
        {...bindPopover(popupState)}
      >
        <Paper>
          <Box sx={{ p: 1 }}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void create();
              }}
            >
              <TextField
                autoFocus
                label="Directory Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Button disabled={isPending} type="submit">
                Create
              </Button>
            </form>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

/**
 * Opens the caller's own file picker for the directory Files is displaying. Dropping files on the
 * table does the same thing, so both routes to an upload answer to the same capability.
 */
export const UploadFileControl = ({
  capability,
  openUploadDialog,
}: {
  capability: ProjectCapability;
  openUploadDialog: DropzoneState["open"];
}) => (
  <CapabilityIconButton
    capability={capability}
    size="large"
    title="Upload unmanaged file"
    onClick={() => capabilityIsEnabled(capability) && openUploadDialog()}
  >
    <CloudUploadRoundedIcon />
  </CapabilityIconButton>
);
