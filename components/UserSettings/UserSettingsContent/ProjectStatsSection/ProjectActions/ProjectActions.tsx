import type { ProductDmProjectTier } from '@squonk/account-server-client';
import { useGetProject } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { CircularProgress, Typography } from '@material-ui/core';

import { getErrorMessage } from '../../../../../utils/orvalError';
import { DeleteProjectButton } from './DeleteProjectButton';
import { EditProjectButton } from './EditProjectButton';

export interface ProjectActionsProps {
  /**
   * Project product details.
   */
  projectProduct: ProductDmProjectTier;
}

/**
 * Table cell with edit and delete actions for provided project product.
 */
export const ProjectActions = ({ projectProduct }: ProjectActionsProps) => {
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useGetProject(projectProduct.claim?.id ?? '', {
    query: { enabled: !!projectProduct.claim?.id },
  });

  if (isLoading) {
    return <CircularProgress size="1rem" />;
  }

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return project ? (
    <div
      css={css`
        display: flex;
      `}
    >
      <EditProjectButton project={project} projectProduct={projectProduct} />
      <DeleteProjectButton project={project} projectProduct={projectProduct} />
    </div>
  ) : null;
};
