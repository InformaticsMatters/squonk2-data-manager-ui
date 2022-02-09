import { Grid } from '@material-ui/core';

import { OrganisationAutocomplete } from './OrganisationAutocomplete';
import { UnitAutocomplete } from './UnitAutocomplete';

export const ContextSection = () => {
  return (
    <Grid container spacing={1}>
      <Grid container item alignItems="center" sm={6}>
        <OrganisationAutocomplete />
      </Grid>
      <Grid container item alignItems="center" sm={6}>
        <UnitAutocomplete />
      </Grid>
    </Grid>
  );
};
