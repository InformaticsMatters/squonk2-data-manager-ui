import React, { FC } from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetDatasetsQueryKey,
  useCreateDatasetFromFile,
} from '@squonk/data-manager-client/dataset';

import { IconButton, Tooltip } from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';

import { useMimeTypeLookup } from '../../FileUpload/useMimeTypeLookup';
import { ProjectId } from '../../state/currentProjectHooks';
import { TableFile } from '../types';

interface CreateDatasetFromFileButtonProps {
  projectId: ProjectId;
  file: TableFile;
}

export const CreateDatasetFromFileButton: FC<CreateDatasetFromFileButtonProps> = ({
  file,
  projectId,
}) => {
  const queryClient = useQueryClient();

  const createDatasetMutation = useCreateDatasetFromFile();

  const mimeLookup = useMimeTypeLookup();

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
            await createDatasetMutation.mutateAsync({
              data: {
                project_id: projectId,
                file_name: file.fileName,
                path,
                dataset_type: mimeType,
              },
            });
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
