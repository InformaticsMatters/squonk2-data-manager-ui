import type { DmError } from "@squonk/data-manager-client";
import {
  getGetDatasetsQueryKey,
  useCreateDatasetFromFile,
} from "@squonk/data-manager-client/dataset";

import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import { IconButton, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import type { ProjectId } from "../../../hooks/projectHooks";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { useMimeTypeLookup } from "../../../hooks/useMimeTypeLookup";
import { useSelectedOrganisation } from "../../../state/organisationSelection";
import { useSelectedUnit } from "../../../state/unitSelection";
import type { TableFile } from "../types";

export interface CreateDatasetFromFileButtonProps {
  /**
   * The ID of the project the file is under
   */
  projectId: ProjectId;
  /**
   * The file object to be made into a dataset
   */
  file: TableFile;
}

/**
 * Button allowing a file to be made into a dataset
 *
 * TODO: this needs a feedback mechanism
 */
export const CreateDatasetFromFileButton = ({
  file,
  projectId,
}: CreateDatasetFromFileButtonProps) => {
  const queryClient = useQueryClient();

  const { mutateAsync: createDataset } = useCreateDatasetFromFile();

  const mimeLookup = useMimeTypeLookup();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  return (
    <Tooltip title="Create a dataset from this unmanaged file">
      <IconButton
        size="small"
        onClick={async () => {
          if (projectId && file.fullPath && organisation && unit) {
            // Get file extensions from the file name
            const [, ...extensions] = file.fileName.split(".");
            // Convert the extension to a mime-type
            const mimeType = mimeLookup["." + extensions.join(".")];
            // Get the path in the format required for the dataset PUT endpoint
            // Must start with a '/'
            // Full path is missing the leading '/'
            // Remove the file name from the end the full path
            const path =
              "/" + file.fullPath.substring(0, file.fullPath.indexOf("/" + file.fileName));

            try {
              await createDataset({
                data: {
                  project_id: projectId,
                  file_name: file.fileName,
                  path,
                  dataset_type: mimeType,
                  unit_id: unit.id,
                },
              });

              enqueueSnackbar("New dataset created", { variant: "success" });
            } catch (error) {
              enqueueError(error);
            }
          }
          // Force an update of the datasets table which has now changed
          queryClient.invalidateQueries(getGetDatasetsQueryKey());
        }}
      >
        <AddCircleRoundedIcon />
      </IconButton>
    </Tooltip>
  );
};
