import React from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetDatasetsQueryKey,
  useCreateDatasetFromFile,
} from '@squonk/data-manager-client/dataset';

import { useUser } from '@auth0/nextjs-auth0';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Button, Link, Typography, useTheme } from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';

import { useMimeTypeLookup } from '../FileUpload/useMimeTypeLookup';
import { AttachButton } from './AttachButton';
import { DeleteDataset } from './DeleteDataset';
import { DetachDataset } from './DetachDataset';
import { NewVersionButton } from './NewVersionButton';
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
              color="inherit"
              component="button"
              css={css`
                display: flex;
                gap: ${theme.spacing(1)}px;
              `}
              variant="body1"
              onClick={() => row.actions.changePath(row.path)}
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
          {isDataset(row) && (
            <AttachButton
              datasetId={row.dataset_id}
              fileName={row.fileName}
              versions={row.versions}
            />
          )}
          {isDataset(row) &&
            user?.preferred_username &&
            (row.editors.includes(user.preferred_username as string) ||
              row.owner === user.preferred_username) && (
              <DeleteDataset datasetId={row.dataset_id} versions={row.versions} />
            )}
          {isDataset(row) &&
            user?.preferred_username &&
            (row.editors.includes(user.preferred_username as string) ||
              row.owner === user.preferred_username) && <NewVersionButton dataset={row} />}
          {isTableFile(row) && row.file_id?.startsWith('file') && (
            <DetachDataset fileId={row.file_id} projectId={row.actions.projectId} />
          )}
          {isTableFile(row) && (!row.immutable || row.file_id === undefined) && (
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
                queryClient.invalidateQueries(getGetDatasetsQueryKey());
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
      } else if (row.file_id) {
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
    case 'numberOfVersions': {
      return isDataset(row) ? (
        <Cell column={column} row={row} {...rest}>
          {row.versions.length}
        </Cell>
      ) : null;
    }
    default:
      return <Cell column={column} row={row} {...rest} />;
  }
};

const Cell = styled(Table.Cell)`
  padding-top: 0;
  padding-bottom: 0;
`;
