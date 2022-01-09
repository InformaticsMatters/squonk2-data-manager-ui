import { useQueryClient } from 'react-query';

import type { DmError } from '@squonk/data-manager-client';
import {
  getGetDatasetsQueryKey,
  useCreateDatasetFromFile,
} from '@squonk/data-manager-client/dataset';

import { IconButton, Tooltip } from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';

import type { ProjectId } from '../../../hooks/currentProjectHooks';
import { useEnqueueError } from '../../../hooks/useEnqueueStackError';
import { useMimeTypeLookup } from '../../../hooks/useMimeTypeLookup';
import { ORG_ID, UNIT_ID } from '../../../utils/ASIdentities';
import type { TableFile } from '../types';

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

  return (
    <Tooltip title="Create a dataset from this managed file">
      <IconButton
        size="small"
        onClick={async () => {
          if (projectId && file.fullPath) {
            // Get file extensions from the file name
            const [, ...extensions] = file.fileName.split('.');
            // Convert the extension to a mime-type
            const mimeType = mimeLookup['.' + extensions.join('.')];
            // Get the path in the format required for the dataset PUT endpoint
            // Must start with a '/'
            // Full path is missing the leading '/'
            // Remove the file name from the end the full path
            const path =
              '/' + file.fullPath.substring(0, file.fullPath.indexOf('/' + file.fileName));

            try {
              await createDataset({
                data: {
                  project_id: projectId,
                  file_name: file.fileName,
                  path,
                  dataset_type: mimeType,
                  organisation_id: ORG_ID,
                  unit_id: UNIT_ID,
                },
              });

              enqueueSnackbar('New dataset created', { variant: 'success' });
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
