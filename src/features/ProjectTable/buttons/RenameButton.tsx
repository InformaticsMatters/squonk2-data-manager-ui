import { useState } from "react";

import {
  getGetFilesQueryKey,
  useMoveFileInProject,
  useMovePath,
} from "@squonk/data-manager-client/file-and-path";
import { getGetProjectQueryKey } from "@squonk/data-manager-client/project";

import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import { Box, IconButton, type IconButtonProps, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Field } from "formik";
import { TextField } from "formik-mui";

import { FormikModalWrapper } from "../../../components/modals/FormikModalWrapper";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";

// removed type from IconButtonProps as it's also defined there
export interface RenameButtonProps extends Omit<IconButtonProps, "type"> {
  projectId: string;
  type: "directory" | "file";
  path: string;
}

export const RenameButton = ({ projectId, type, path, ...buttonProps }: RenameButtonProps) => {
  const { mutateAsync: moveFile } = useMoveFileInProject();
  const { mutateAsync: moveDirectory } = useMovePath();

  const [open, setOpen] = useState(false);
  const initialValues = {
    dstPath: path,
  };

  const { enqueueSnackbar, enqueueError } = useEnqueueError();

  const queryClient = useQueryClient();

  const handleSubmit = async ({ dstPath }: typeof initialValues) => {
    try {
      // E.g. for a type="file": /path/to/file.txt -> /new/path/to/file.txt
      const fileName = path.split("/").pop() as string; // file.txt
      const srcPath = "/" + path.split("/").slice(0, -1).join("/"); // /path/to
      const dstPathStem = "/" + dstPath.split("/").slice(0, -1).join("/"); // /new/path/to
      const dstFile = dstPath.split("/").pop() as string; // file.txt

      await (type === "directory"
        ? moveDirectory({
            params: {
              project_id: projectId,
              dst_path: "/" + dstPath,
              src_path: "/" + path,
            },
          })
        : moveFile({
            params: {
              project_id: projectId,
              file: fileName,
              src_path: srcPath,
              dst_path: dstPathStem,
              dst_file: dstFile,
            },
          }));

      enqueueSnackbar({ message: "Renamed and/or moved", variant: "success" });

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
        queryClient.invalidateQueries({
          queryKey: getGetFilesQueryKey({ project_id: projectId, path: srcPath }),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetFilesQueryKey({ project_id: projectId, path: dstPathStem }),
        }),
      ]);

      setOpen(false);
    } catch (error) {
      enqueueError(error);
    }
  };

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
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Box p={1}>
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
