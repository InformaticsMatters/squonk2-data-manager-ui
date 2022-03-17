import { Grid } from '@material-ui/core';

import { OrganisationAutocomplete } from './userContext/OrganisationAutocomplete';
import { ProjectAutocomplete } from './userContext/ProjectAutocomplete';
import { UnitAutocomplete } from './userContext/UnitAutocomplete';

export const ProjectSelection = () => {
  return (
    <Grid container spacing={1}>
      <Grid container item alignItems="center" sm={6}>
        <OrganisationAutocomplete />
      </Grid>
      <Grid container item alignItems="center" sm={6}>
        <UnitAutocomplete />
      </Grid>
      <Grid container item alignItems="center" sm={12}>
        <ProjectAutocomplete size="medium" />
      </Grid>
    </Grid>
  );
};
