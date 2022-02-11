import { css } from '@emotion/react';
import { List, Typography, useTheme } from '@material-ui/core';

import { useOrganisationUnit } from '../../../../../context/organisationUnitContext';
import { CreateProjectListItem } from './CreateProjectListItem';

/**
 * Displays actions related to context.
 */
export const ContextActions = () => {
  const theme = useTheme();

  const {
    organisationUnit: { unit },
  } = useOrganisationUnit();

  if (!unit) {
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
      <CreateProjectListItem />
    </List>
  );
};
