import { type ReactNode, useCallback } from "react";
import { type DropzoneState, type FileRejection, useDropzone } from "react-dropzone";

import { getGetFilesQueryKey } from "@squonk/data-manager-client/file-and-path";
import { useAddFileToProject } from "@squonk/data-manager-client/project";

import { Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { FileHoverCover } from "./FileHoverCover";

export interface ProjectFileUploadProps {
  children: (open: DropzoneState["open"]) => ReactNode;
}

export const ProjectFileUpload = ({ children }: ProjectFileUploadProps) => {
  const { projectId } = useCurrentProjectId();
  const { enqueueError, enqueueSnackbar, closeSnackbar } = useEnqueueError();

  const breadcrumbs = useProjectBreadcrumbs();
  const path = "/" + breadcrumbs.join("/");

  const { mutateAsync: uploadProjectFile } = useAddFileToProject();

  const queryClient = useQueryClient();

  const uploadFile = useCallback(
    async (file: File) => {
      const key = enqueueSnackbar(`Uploading file ${file.name}`, { autoHideDuration: 10_000 });
      if (projectId) {
        try {
          await uploadProjectFile({
            projectId,
            data: { as_filename: file.name, file, path },
          });
          enqueueSnackbar(`${file.name} was uploaded`, { variant: "success" });
          void queryClient.invalidateQueries({
            queryKey: getGetFilesQueryKey({ project_id: projectId, path }),
          });
        } catch (error) {
          enqueueError(error);
        }
        closeSnackbar(key);
      }
    },
    [closeSnackbar, enqueueError, enqueueSnackbar, path, projectId, queryClient, uploadProjectFile],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      // Upload each valid file and display updates with notistack
      for (const file of acceptedFiles) {
        void uploadFile(file);
      }

      // Display rejected files and notistack errors
      for (const rejection of rejections) {
        enqueueSnackbar(`${rejection.file.name} was rejected`, { variant: "error" });
      }
    },
    [enqueueSnackbar, uploadFile],
  );
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <Box sx={{ position: "relative" }} {...getRootProps()}>
      <FileHoverCover active={isDragActive} />
      <input {...getInputProps()} />
      {children(open)}
    </Box>
  );
};
