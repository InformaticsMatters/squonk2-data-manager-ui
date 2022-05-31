import { useQueryClient } from "react-query";

import type { DmError } from "@squonk/data-manager-client";
import { getGetFilesQueryKey, useDeleteFile } from "@squonk/data-manager-client/file";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { IconButtonProps } from "@mui/material";
import { IconButton } from "@mui/material";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { WarningDeleteButton } from "../../WarningDeleteButton";

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
          await queryClient.invalidateQueries(getGetFilesQueryKey({ project_id: projectId, path }));

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
