import React, { FC, useState } from 'react';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { ProjectDetail } from '@squonk/data-manager-client';

import { ModalWrapper } from '../ModalWrapper';
import { AddEditor } from './AddEditor';
import { Editors } from './Editors';

interface EditProjectProps {
  canEdit: boolean;
  inverted?: boolean;
  currentProject: ProjectDetail | null;
}

export const EditProject: FC<EditProjectProps> = ({
  currentProject,
  inverted = false,
  canEdit,
}) => {
  const [open, setOpen] = useState(false);

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
        title="Edit Project"
        submitText="Save"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Typography variant="h5" gutterBottom>
          {currentProject?.name}
        </Typography>
        {!!currentProject && (
          <>
            <div>
              <Typography gutterBottom>
                <b>Owner</b>: {currentProject.owner}
              </Typography>
            </div>
            <Editors currentProject={currentProject} />
            <AddEditor currentProject={currentProject} />
          </>
        )}
      </ModalWrapper>
    </>
  );
};
