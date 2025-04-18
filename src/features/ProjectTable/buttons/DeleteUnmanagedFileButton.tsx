import { type DeleteUnmanagedFileParams, type DmError } from "@squonk/data-manager-client";
import {
  getGetFilesQueryKey,
  useDeleteUnmanagedFile,
} from "@squonk/data-manager-client/file-and-path";

import { DeleteForeverRounded as DeleteForeverRoundedIcon } from "@mui/icons-material";
import { IconButton, type IconButtonProps } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WarningDeleteButton } from "../../../components/WarningDeleteButton";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";

export interface DeleteUnmanagedFileButtonProps extends IconButtonProps {
  /**
   * ID of the project containing the unmanaged file
   */
  projectId: DeleteUnmanagedFileParams["project_id"];
  /**
   * Path inside the project to the unmanaged file
   */
  path: DeleteUnmanagedFileParams["path"];
  /**
   * Name of the unmanaged file
   */
  fileName: DeleteUnmanagedFileParams["file"];
}

/**
 * Action to delete an unmanaged file from a project
 */
export const DeleteUnmanagedFileButton = ({
  projectId,
  path,
  fileName,
  ...buttonProps
}: DeleteUnmanagedFileButtonProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteFile } = useDeleteUnmanagedFile();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <WarningDeleteButton
      modalId={`delete-file-${path}-${fileName}`}
      submitText="Delete"
      title="Delete unmanaged file"
      tooltipText="Delete unmanaged file"
      onDelete={async () => {
        try {
          await deleteFile({ params: { file: fileName, path, project_id: projectId } });
          await queryClient.invalidateQueries({
            queryKey: getGetFilesQueryKey({ project_id: projectId, path }),
          });

          enqueueSnackbar("Unmanaged file deleted", { variant: "success" });
        } catch (error) {
          enqueueError(error);
        }
      }}
    >
      {({ openModal }) => (
        <IconButton
          {...buttonProps}
          aria-label="Delete this unmanaged file"
          size="small"
          onClick={openModal}
        >
          <DeleteForeverRoundedIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
