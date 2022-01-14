import { useState } from 'react';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';

import { useCurrentProject } from '../../hooks/projectHooks';
import { ModalWrapper } from '../modals/ModalWrapper';
import { Editors } from './ProjectEditors';
import type { CommonProps } from './types';

export interface EditProjectProps extends CommonProps {
  /**
   * Whether the user can edit the currently selected project
   */
  canEdit: boolean;
}

/**
 * Button controlling a modal with options to edit the project editors
 */
export const EditProject = ({ inverted = false, canEdit }: EditProjectProps) => {
  const [open, setOpen] = useState(false);

  const currentProject = useCurrentProject();

  return (
    <>
      <Tooltip title={canEdit ? 'Edit Project' : 'Select a project of which you have ownership'}>
        <span>
          <IconButton
            color={inverted ? 'inherit' : 'default'}
            disabled={!canEdit}
            onClick={() => setOpen(!open)}
          >
            <EditIcon />
          </IconButton>
        </span>
      </Tooltip>
      <ModalWrapper
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id="edit-project"
        open={open}
        submitText="Save"
        title="Edit Project"
        onClose={() => setOpen(false)}
      >
        <Typography gutterBottom variant="h5">
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
