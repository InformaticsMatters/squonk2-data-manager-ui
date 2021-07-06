import React, { FC, useState } from 'react';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';

import { useCurrentProject } from '../CurrentProjectContext';
import { ModalWrapper } from '../Modals/ModalWrapper';
import { Editors } from './Editors';

interface EditProjectProps {
  canEdit: boolean;
  inverted?: boolean;
}

export const EditProject: FC<EditProjectProps> = ({ inverted = false, canEdit }) => {
  const [open, setOpen] = useState(false);

  const currentProject = useCurrentProject();

  return (
    <>
      <Tooltip
        arrow
        title={canEdit ? 'Edit Project' : 'Select a project of which you have ownership'}
      >
        <>
          <Tooltip title="Edit Project">
            <span>
              <IconButton
                disabled={!canEdit}
                color={inverted ? 'inherit' : 'default'}
                onClick={() => setOpen(!open)}
              >
                <EditIcon />
              </IconButton>
            </span>
          </Tooltip>
        </>
      </Tooltip>
      <ModalWrapper
        id="edit-project"
        title="Edit Project"
        submitText="Save"
        open={open}
        onClose={() => setOpen(false)}
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
      >
        <Typography variant="h5" gutterBottom>
          {currentProject?.name}
        </Typography>
        <div>
          <Typography gutterBottom>
            <b>Owner</b>: {currentProject?.owner}
          </Typography>
        </div>
        <Editors />
      </ModalWrapper>
    </>
  );
};
