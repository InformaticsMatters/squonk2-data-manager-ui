import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';

import { IconButton, ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core';
import FindInPageRoundedIcon from '@material-ui/icons/FindInPageRounded';

import { ModalWrapper } from '../../modals/ModalWrapper';
import type { DatasetSchemaViewProps } from './DatasetSchemaView';
import { DatasetSchemaView } from './DatasetSchemaView';

export type DatasetSchemaListItemProps = DatasetSchemaViewProps;

export const DatasetSchemaListItem: FC<DatasetSchemaListItemProps> = ({ datasetId, version }) => {
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
