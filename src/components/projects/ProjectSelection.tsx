import { Grid2 as Grid } from "@mui/material";

import { SelectOrganisation } from "../userContext/SelectOrganisation";
import { SelectProject } from "../userContext/SelectProject";
import { SelectUnit } from "../userContext/SelectUnit";

export const ProjectSelection = () => {
  return (
    <Grid container spacing={1}>
      <Grid container alignItems="baseline" size={{ sm: 6 }}>
        <SelectOrganisation />
      </Grid>
      <Grid container alignItems="baseline" size={{ sm: 6 }}>
        <SelectUnit userFilter={["none"]} />
      </Grid>
      <Grid container alignItems="baseline" size={{ sm: 12 }}>
        <SelectProject size="medium" />
      </Grid>
    </Grid>
  );
};
