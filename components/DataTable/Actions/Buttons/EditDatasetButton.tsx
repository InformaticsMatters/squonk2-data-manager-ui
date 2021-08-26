import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';

import { IconButton, Tooltip } from '@material-ui/core';
import EditRoundedIcon from '@material-ui/icons/EditRounded';

import { DatasetDetails } from '../../../DatasetDetails/DatasetDetails';
import { ModalWrapper } from '../../../Modals/ModalWrapper';
import type { TableDataset } from '../../types';

export interface EditDatasetButtonProps {
  dataset: TableDataset;
}

export const EditDatasetButton: FC<EditDatasetButtonProps> = ({ dataset }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Edit properties of this dataset">
        <IconButton size="small" onClick={() => setOpen(true)}>
          <EditRoundedIcon />
        </IconButton>
      </Tooltip>
      <ModalWrapper
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id={`edit-dataset-${dataset.dataset_id}`}
        open={open}
        submitText="Upload"
        title={`Edit dataset: ${dataset.fileName}`}
        onClose={() => setOpen(false)}
      >
        <DatasetDetails dataset={dataset} />
      </ModalWrapper>
    </>
  );
};
