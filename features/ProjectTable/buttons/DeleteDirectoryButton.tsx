import { getGetFilesQueryKey, useDeletePath } from "@squonk/data-manager-client/file-and-path";

import { DeleteForeverRounded as DeleteForeverRoundedIcon } from "@mui/icons-material";
import type { IconButtonProps } from "@mui/material";
import { IconButton } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WarningDeleteButton } from "../../../components/WarningDeleteButton";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";

export interface DeleteDirectoryButtonProps extends IconButtonProps {
  path: string;
  directoryName: string;
  projectId: string;
}

export const DeleteDirectoryButton = ({
  path,
  directoryName,
  projectId,
  ...buttonProps
}: DeleteDirectoryButtonProps) => {
  const { mutateAsync: deletePath } = useDeletePath();
  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const onDelete = async () => {
    try {
      await deletePath({
        params: {
          project_id: projectId,
          path: path.endsWith("/") ? path + directoryName : path + "/" + directoryName,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: getGetFilesQueryKey({ project_id: projectId, path }),
      });

      enqueueSnackbar("The directory was deleted successfully");
    } catch (error) {
      enqueueError(error);
    }
  };
  return (
    <WarningDeleteButton
      modalId={`delete-directory-${path}`}
      submitText="Delete"
      title="Delete Directory"
      tooltipText="Delete Directory"
      onDelete={onDelete}
    >
      {({ openModal }) => (
        <IconButton
          {...buttonProps}
          aria-label="Delete selected dataset"
          size="small"
          onClick={openModal}
        >
          <DeleteForeverRoundedIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
