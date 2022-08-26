import { Grid } from "@mui/material";

import { OrganisationAutocomplete } from "../../../../components/userContext/OrganisationAutocomplete";
import { UnitAutocomplete } from "../../../../components/userContext/UnitAutocomplete";
import { ContextActions } from "./ContextActions";

/**
 * Displays `Context` section in User Settings.
 */
export const ContextSection = () => {
  return (
    <>
      <Grid container spacing={1}>
        <Grid container item sm={6}>
          <OrganisationAutocomplete />
        </Grid>
        <Grid container item sm={6}>
          <UnitAutocomplete />
        </Grid>
      </Grid>
      <ContextActions />
    </>
  );
};
