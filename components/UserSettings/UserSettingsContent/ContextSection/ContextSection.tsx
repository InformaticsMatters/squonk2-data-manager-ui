import { Grid } from '@material-ui/core';

import { ContextActions } from './ContextActions';
import { OrganisationAutocomplete } from './OrganisationAutocomplete';
import { UnitAutocomplete } from './UnitAutocomplete';

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
