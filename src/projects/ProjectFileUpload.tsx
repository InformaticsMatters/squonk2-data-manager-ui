import { type ReactNode } from "react";
import { type DropzoneState, type FileRejection, useDropzone } from "react-dropzone";

import { Alert, AlertTitle, Box, styled, Typography } from "@mui/material";
import { useSnackbar } from "notistack";

import { capabilityIsEnabled, type ProjectCapability } from "./capabilities";
import { useFileCommands } from "./useFileCommands";
import { useFileMutation } from "./useFileMutation";

const HoverBox = styled("div")(({ theme }) => ({
  left: 0,
  // The cover only says a drop would land here; it never takes a click away from the row beneath
  // it, so an invisible cover cannot swallow the link or action a caller was aiming at.
  pointerEvents: "none",
  position: "absolute",
  right: 0,
  transition: `${theme.transitions.easing.easeIn} opacity ${theme.transitions.duration.shortest}ms`,
}));

const FileHoverCover = ({ active }: { active: boolean }) => (
  <>
    <HoverBox
      sx={{ backgroundColor: "grey.600", bottom: 0, opacity: active ? "40%" : "0%", top: 0 }}
    />
    <HoverBox
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        opacity: active ? "100%" : "0%",
        top: "50px",
      }}
    >
      <Alert severity="info">
        <AlertTitle>
          <Typography component="h2" variant="h3">
            Upload to this directory
          </Typography>
        </AlertTitle>
        <Typography component="p" variant="h4">
          Drag and drop files here
        </Typography>
      </Alert>
    </HoverBox>
  </>
);

/**
 * Accepts dropped files into the directory Files is displaying, in the project the URL addresses.
 * Both the project and the path are required arguments, so a dropped file cannot land in a project
 * or a directory other than the one on screen. A caller whose capability does not offer uploading
 * gets no drop target at all, so a drop cannot start work the Data Manager would only refuse.
 */
export const ProjectFileUpload = ({
  capability,
  children,
  path,
  projectId,
}: {
  capability: ProjectCapability;
  children: (open: DropzoneState["open"]) => ReactNode;
  path: string;
  projectId: string;
}) => {
  const commands = useFileCommands(projectId);
  const { run } = useFileMutation();
  const { enqueueSnackbar } = useSnackbar();

  const onDrop = (accepted: File[], rejections: FileRejection[]) => {
    for (const file of accepted) {
      void run("upload", `${file.name} to this project`, () => commands.uploadFile(path, file));
    }
    for (const rejection of rejections) {
      enqueueSnackbar(`${rejection.file.name} was rejected.`, { variant: "error" });
    }
  };

  const { getInputProps, getRootProps, isDragActive, open } = useDropzone({
    disabled: !capabilityIsEnabled(capability),
    noClick: true,
    onDrop,
  });

  return (
    <Box sx={{ position: "relative" }} {...getRootProps()}>
      <FileHoverCover active={isDragActive} />
      <input {...getInputProps()} />
      {children(open)}
    </Box>
  );
};
