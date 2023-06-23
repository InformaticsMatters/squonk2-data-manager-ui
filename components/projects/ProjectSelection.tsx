import { Grid } from "@mui/material";

import { SelectOrganisation } from "../userContext/SelectOrganisation";
import { SelectProject } from "../userContext/SelectProject";
import { SelectUnit } from "../userContext/SelectUnit";

export const ProjectSelection = () => {
  return (
    <Grid container spacing={1}>
      <Grid container item alignItems="center" sm={6}>
        <SelectOrganisation />
      </Grid>
      <Grid container item alignItems="center" sm={6}>
        <SelectUnit userFilter={["none"]} />
      </Grid>
      <Grid container item alignItems="center" sm={12}>
        <SelectProject size="medium" />
      </Grid>
    </Grid>
  );
};
