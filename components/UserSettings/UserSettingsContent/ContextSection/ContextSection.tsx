import { Grid } from '@mui/material';

import { OrganisationAutocomplete } from '../../../userContext/OrganisationAutocomplete';
import { UnitAutocomplete } from '../../../userContext/UnitAutocomplete';
import { ContextActions } from './ContextActions';

/**
 * Displays `Context` section in User Settings.
 */
export const ContextSection = () => {
  return (
    <>
      <Grid container spacing={1}>
        <Grid container item alignItems="center" sm={6}>
          <OrganisationAutocomplete />
        </Grid>
        <Grid container item alignItems="center" sm={6}>
          <UnitAutocomplete />
        </Grid>
      </Grid>
      <ContextActions />
    </>
  );
};
