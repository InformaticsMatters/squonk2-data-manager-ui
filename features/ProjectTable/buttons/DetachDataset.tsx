import { type DmError } from "@squonk/data-manager-client";
import { getGetFilesQueryKey, useDeleteFile } from "@squonk/data-manager-client/file-and-path";

import { DeleteOutlineRounded as DeleteOutlineRoundedIcon } from "@mui/icons-material";
import { IconButton, type IconButtonProps } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WarningDeleteButton } from "../../../components/WarningDeleteButton";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";

export interface DetachDatasetProps extends IconButtonProps {
  /**
   * ID of a file.
   */
  fileId: string;
  /**
   * ID of the project.
   */
  projectId: string;
  /**
   * Path inside the project to the managed file.
   */
  path: string;
}

/**
 * Detach a managed file from a project
 */
export const DetachDataset = ({ fileId, projectId, path, ...buttonProps }: DetachDatasetProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: detachDataset } = useDeleteFile();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <WarningDeleteButton
      modalId={`detach-dataset-${fileId}`}
      submitText="Detach"
      title="Detach File"
      tooltipText="Detach File"
      onDelete={async () => {
        try {
          await detachDataset({ fileId });
          await queryClient.invalidateQueries({
            queryKey: getGetFilesQueryKey({ project_id: projectId, path }),
          });

          enqueueSnackbar("The attached dataset was successfully detached");
        } catch (error) {
          enqueueError(error);
        }
      }}
    >
      {({ openModal }) => (
        <IconButton
          {...buttonProps}
          aria-label="Delete selected dataset"
          size="small"
          onClick={openModal}
        >
          {/* We use the non-permanent delete icon here as a detach doesn't delete the source dataset */}
          <DeleteOutlineRoundedIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
