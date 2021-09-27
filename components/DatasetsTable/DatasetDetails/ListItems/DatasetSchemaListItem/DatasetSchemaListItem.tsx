import { useState } from 'react';
import React from 'react';

import { IconButton, ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core';
import FindInPageRoundedIcon from '@material-ui/icons/FindInPageRounded';

import { ModalWrapper } from '../../../../modals/ModalWrapper';
import type { DatasetSchemaViewProps } from './DatasetSchemaView';
import { DatasetSchemaView } from './DatasetSchemaView';

/**
 * Props are the same as {@link DatasetSchemaView} but export a copy in case we need to make them
 * differ in the future.
 */
export type DatasetSchemaListItemProps = DatasetSchemaViewProps;

/**
 * MuiListItem with an action that open a modal that lets the user manage the schema of a version
 * of a dataset. The user can edit the dataset schema description, field descriptions and types.
 */
export const DatasetSchemaListItem = ({ datasetId, version }: DatasetSchemaListItemProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem button onClick={() => setOpen(true)}>
        <ListItemText
          primary="View and Edit the Dataset Schema"
          secondary="View the available fields and their description and data type"
        />
        <ListItemSecondaryAction>
          <IconButton edge="end" onClick={() => setOpen(true)}>
            <FindInPageRoundedIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      <ModalWrapper
        DialogProps={{ maxWidth: 'md', fullWidth: true }}
        id={`${datasetId}-schema`}
        open={open}
        title="Edit Schema"
        onClose={() => setOpen(false)}
      >
        <DatasetSchemaView datasetId={datasetId} version={version} />
      </ModalWrapper>
    </>
  );
};
