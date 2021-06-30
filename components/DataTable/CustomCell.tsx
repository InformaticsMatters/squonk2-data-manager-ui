import React from 'react';

import { useQueryClient } from 'react-query';

import { useUser } from '@auth0/nextjs-auth0';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Button, Link, Typography, useTheme } from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';
import {
  getGetAvailableDatasetsQueryKey,
  useCreateDatasetFromFile,
} from '@squonk/data-manager-client/dataset';

import { useMimeTypeLookup } from '../FileUpload/useMimeTypeLookup';
import { AttachButton } from './AttachButton';
import { DeleteDataset } from './DeleteDataset';
import { DetachDataset } from './DetachDataset';
import { Row } from './types';
import { isDataset, isTableDir, isTableFile } from './utils';

type CustomCellProps = Omit<Table.DataCellProps, 'row'> & {
  row: Row;
};

/**
 * Display custom cell content.
 * ? We should probably implement this with a `Plugin` rather than this hack
 */
export const CustomCell: React.FC<CustomCellProps> = ({ row, column, ...rest }) => {
  const queryClient = useQueryClient();

  const createDatasetMutation = useCreateDatasetFromFile();

  const { user } = useUser();

  const mimeLookup = useMimeTypeLookup();

  const theme = useTheme();

  switch (column.name) {
    case 'fileName':
      return (
        <Cell column={column} row={row} {...rest}>
          {!isTableFile(row) && isTableDir(row) ? (
            <Link
              variant="body1"
              color="inherit"
              component="button"
              onClick={() => row.actions.changePath(row.path)}
              css={css`
                display: flex;
                gap: ${theme.spacing(1)}px;
              `}
            >
              <FolderRoundedIcon /> {row.fileName}
            </Link>
          ) : (
            <Typography variant="body1">{row.fileName}</Typography>
          )}
        </Cell>
      );
    case 'actions':
      return (
        <Cell column={column} row={row} {...rest}>
          {/* <Button>Download</Button> */}
          {isDataset(row) &&
            row.id.startsWith('dataset') &&
            user?.preferred_username &&
            (row.editors.includes(user.preferred_username as string) ||
              row.owner === user.preferred_username) && <DeleteDataset datasetId={row.id} />}
          {isDataset(row) && row.id.startsWith('dataset') && (
            <AttachButton datasetId={row.id} fileName={row.fileName} />
          )}
          {isTableFile(row) && row.id?.startsWith('file') && (
            <DetachDataset fileId={row.id} projectId={row.actions.projectId} />
          )}
          {isTableFile(row) && (!row.immutable || row.id === undefined) && (
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
          )}
          {/* <Button>Edit</Button> */}
        </Cell>
      );
    case 'mode': {
      let value: string;
      if (!isTableFile(row)) {
        value = '-';
      } else if (row.immutable) {
        value = 'immutable';
      } else if (row.id) {
        value = 'editable';
      } else {
        value = 'unmanaged';
      }
      return (
        <Cell column={column} row={row} {...rest}>
          {value}
        </Cell>
      );
    }
    default:
      return <Cell column={column} row={row} {...rest} />;
  }
};

const Cell = styled(Table.Cell)`
  padding-top: 0;
  padding-bottom: 0;
`;
