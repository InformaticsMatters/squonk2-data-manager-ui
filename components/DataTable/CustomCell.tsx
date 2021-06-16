import React from 'react';

import { useQueryClient } from 'react-query';

import { Table } from '@devexpress/dx-react-grid-material-ui';
import styled from '@emotion/styled';
import { Button } from '@material-ui/core';
import {
  getGetAvailableDatasetsQueryKey,
  getGetProjectQueryKey,
  useCreateDatasetFromProjectFile,
  useDeleteDataset,
  useDeleteFile,
} from '@squonk/data-manager-client';

import { useMimeTypeLookup } from '../FileUpload/useMimeTypeLookup';
import { AttachButton } from './AttachButton';
import { TableRow } from './types';

type CustomCellProps = Omit<Table.DataCellProps, 'row'> & {
  row: TableRow;
};

/**
 * Display custom cell content.
 * ? We should probably implement this with a `Plugin` rather than this hack
 */
export const CustomCell: React.FC<CustomCellProps> = ({ row, column, ...rest }) => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDataset();
  const detachMutation = useDeleteFile();
  const createDatasetMutation = useCreateDatasetFromProjectFile();

  const mimeLookup = useMimeTypeLookup();

  const id = row.id;
  const projectId = row.actions.projectId;
  const immutable = row.immutable;

  switch (column.name) {
    case 'actions':
      return (
        <Cell column={column} row={row} {...rest}>
          {/* <Button>Download</Button> */}
          {id?.startsWith('dataset') && (
            <>
              <Button
                onClick={async () => {
                  await deleteMutation.mutateAsync({ datasetid: id });
                  queryClient.invalidateQueries(getGetAvailableDatasetsQueryKey());
                }}
              >
                Delete
              </Button>
              <AttachButton datasetId={id} fileName={row.fileName} />
            </>
          )}
          {id?.startsWith('file') && projectId !== undefined && (
            <>
              <Button
                onClick={async () => {
                  await detachMutation.mutateAsync({ fileid: id });
                  queryClient.invalidateQueries(getGetProjectQueryKey(projectId));
                }}
              >
                Detach
              </Button>
              <Button
                onClick={async () => {
                  if (row.actions.projectId && row.fullPath) {
                    // Get file extensions from the file name
                    const [, ...extensions] = row.fileName.split('.');
                    // Convert the extension to a mime-type
                    const mimeType = mimeLookup['.' + extensions.join('.')];

                    // Get the path in the format required for the dataset PUT endpoint
                    // Must start with a '/'
                    // Full path is missing the leading '/'
                    // Remove the file name from the end the full path
                    const path =
                      '/' + row.fullPath.substring(0, row.fullPath.indexOf('/' + row.fileName));

                    await createDatasetMutation.mutateAsync({
                      data: {
                        project_id: row.actions.projectId,
                        file_name: row.fileName,
                        path: path,
                        dataset_type: mimeType,
                      },
                    });
                  }
                  // Force an update of the datasets table which has now changed
                  queryClient.invalidateQueries(getGetAvailableDatasetsQueryKey());
                }}
              >
                New Dataset
              </Button>
            </>
          )}
          {/* <Button>Edit</Button> */}
        </Cell>
      );
    case 'immutable':
      return (
        <Cell column={column} row={row} {...rest}>
          {immutable === undefined ? '-' : immutable ? 'Yes' : 'No'}
        </Cell>
      );
    default:
      return <Cell column={column} row={row} {...rest} />;
  }
};

const Cell = styled(Table.Cell)`
  padding-top: 0;
  padding-bottom: 0;
`;
