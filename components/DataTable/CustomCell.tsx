import React from 'react';

import { useQueryClient } from 'react-query';

import { Table } from '@devexpress/dx-react-grid-material-ui';
import styled from '@emotion/styled';
import { Button } from '@material-ui/core';
import {
  getGetAvailableDatasetsQueryKey,
  getGetProjectQueryKey,
  useDeleteDataset,
  useDeleteFile,
} from '@squonk/data-manager-client';

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

  const id = row.id;
  const projectId = row.actions?.projectId;

  switch (column.name) {
    case 'actions':
      return (
        <Cell row={row} column={column} {...rest}>
          {/* <Button>Download</Button> */}
          {id.startsWith('dataset') && (
            <>
              <Button
                onClick={async () => {
                  await deleteMutation.mutateAsync(
                    { datasetid: id },
                    {
                      onSuccess: () =>
                        queryClient.invalidateQueries(getGetAvailableDatasetsQueryKey()),
                    },
                  );
                }}
              >
                Delete
              </Button>
              <AttachButton datasetId={id} />
            </>
          )}
          {id.startsWith('file') && projectId !== undefined && (
            <Button
              onClick={async () => {
                await detachMutation.mutateAsync(
                  { projectid: projectId, fileid: id },
                  {
                    onSuccess: () =>
                      queryClient.invalidateQueries(getGetProjectQueryKey(projectId)),
                  },
                );
              }}
            >
              Detach
            </Button>
          )}
          {/* <Button>Edit</Button> */}
        </Cell>
      );
    default:
      return <Cell row={row} column={column} {...rest} />;
  }
};

const Cell = styled(Table.Cell)`
  padding-top: 0;
  padding-bottom: 0;
`;
