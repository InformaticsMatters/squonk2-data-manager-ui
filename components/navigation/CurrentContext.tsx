import { css } from '@emotion/react';
import { Typography } from '@material-ui/core';

import { useOrganisationUnit } from '../../context/organisationUnitContext';
import { useCurrentProject } from '../../hooks/projectHooks';

export const CurrentContext = () => {
  const { organisationUnit } = useOrganisationUnit();
  const currentProject = useCurrentProject();

  const { organisation, unit } = organisationUnit || {};

  return (
    <div
      css={css`
        min-width: 0;
        flex-basis: 200px;
      `}
    >
      <Typography noWrap>Org: {organisation}</Typography>
      <Typography noWrap>Unit: {unit}</Typography>
      <Typography noWrap>Project: {currentProject?.name}</Typography>
    </div>
  );
};
