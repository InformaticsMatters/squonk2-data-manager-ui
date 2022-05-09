import type { ProductDmProjectTier } from '@squonk/account-server-client';

import { Radio } from '@mui/material';

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
      sx={{ p: '1px' }}
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
