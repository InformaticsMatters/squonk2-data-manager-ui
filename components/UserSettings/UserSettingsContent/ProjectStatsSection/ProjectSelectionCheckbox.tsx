import type { ProductDmProjectTier } from '@squonk/account-server-client';

import { css } from '@emotion/react';
import { Radio } from '@material-ui/core';

import { useCurrentProjectId } from '../../../../hooks/projectHooks';

export interface ProjectSelectionCheckboxProps {
  projectProduct: ProductDmProjectTier;
}

export const ProjectSelectionCheckbox = ({ projectProduct }: ProjectSelectionCheckboxProps) => {
  const { projectId, setCurrentProjectId } = useCurrentProjectId();

  const isProjectSelected = projectId === projectProduct.claim?.id;

  return (
    <Radio
      css={css`
        padding: 0;
      `}
      checked={isProjectSelected}
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
