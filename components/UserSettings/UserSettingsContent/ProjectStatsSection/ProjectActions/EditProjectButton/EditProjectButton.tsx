import { useState } from 'react';

import type { ProductDmProjectTier } from '@squonk/account-server-client';
import type { ProjectDetail } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { IconButton, Tooltip, Typography } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';

import { useKeycloakUser } from '../../../../../../hooks/useKeycloakUser';
import { ModalWrapper } from '../../../../../modals/ModalWrapper';
import { ProjectEditors } from './ProjectEditors';

export interface EditProjectButtonProps {
  /**
   * Project to be edited.
   */
  project: ProjectDetail;
  /**
   * Project product details.
   */
  projectProduct: ProductDmProjectTier;
}

/**
 * Button controlling a modal with options to edit the project editors
 */
export const EditProjectButton = ({ project, projectProduct }: EditProjectButtonProps) => {
  const [open, setOpen] = useState(false);

  const { user } = useKeycloakUser();
  const isEditor = !!user.username && !!project.editors.includes(user.username);

  return (
    <>
      {isEditor && (
        <Tooltip title={'Edit Project'}>
          <span>
            <IconButton
              css={css`
                padding: 1px;
              `}
              size="small"
              onClick={() => setOpen(!open)}
            >
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <ModalWrapper
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id="edit-project"
        open={open}
        submitText="Save"
        title="Edit Project"
        onClose={() => setOpen(false)}
      >
        <Typography gutterBottom variant="h5">
          {project.name}
        </Typography>
        <div>
          <Typography gutterBottom>
            <b>Owner</b>: {project.owner}
          </Typography>
        </div>
        <ProjectEditors project={project} projectProduct={projectProduct} />
      </ModalWrapper>
    </>
  );
};
