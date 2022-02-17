import { css } from '@emotion/react';
import { List, Typography, useTheme } from '@material-ui/core';

import { useOrganisationUnit } from '../../../../../context/organisationUnitContext';
import { useKeycloakUser } from '../../../../../hooks/useKeycloakUser';
import { CreateProjectListItem } from './CreateProjectListItem';
import { CreateUnitListItem } from './CreateUnitListItem';

/**
 * Displays actions related to context.
 */
export const ContextActions = () => {
  const theme = useTheme();

  const {
    organisationUnit: { organisation, unit },
  } = useOrganisationUnit();
  const { user } = useKeycloakUser();

  const isOrganisationOwner = organisation?.owner_id === user.username;

  if (!unit && !isOrganisationOwner) {
    return (
      <Typography
        component="p"
        css={css`
          margin-top: ${theme.spacing()}px;
        `}
        variant="subtitle2"
      >
        Please select an organisation and a unit
      </Typography>
    );
  }

  return (
    <List>
      {isOrganisationOwner && <CreateUnitListItem />}
      <CreateProjectListItem />
    </List>
  );
};
