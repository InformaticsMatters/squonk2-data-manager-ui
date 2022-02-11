import type { ProductDmProjectTier } from '@squonk/account-server-client';

import { css } from '@emotion/react';
import { Radio } from '@material-ui/core';

import { useCurrentProjectId } from '../../../../hooks/projectHooks';

export interface ProjectSelectionRadioProps {
  /**
   * Project product details.
   */
  projectProduct: ProductDmProjectTier;
}

/**
 * Radio button which selects or unselects a project.
 */
export const ProjectSelectionRadio = ({ projectProduct }: ProjectSelectionRadioProps) => {
  const { projectId, setCurrentProjectId } = useCurrentProjectId();

  const isProjectSelected = projectId === projectProduct.claim?.id;

  return (
    <Radio
      checked={isProjectSelected}
      css={css`
        padding: 0;
      `}
      onClick={() => {
        if (isProjectSelected) {
          setCurrentProjectId();
        } else {
          setCurrentProjectId(projectProduct.claim?.id);
        }
      }}
    />
  );
};
