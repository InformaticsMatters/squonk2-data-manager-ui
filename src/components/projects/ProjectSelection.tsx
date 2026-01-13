import { Grid } from "@mui/material";

import { SelectOrganisation } from "../userContext/SelectOrganisation";
import { SelectProject } from "../userContext/SelectProject";
import { SelectUnit } from "../userContext/SelectUnit";

export const ProjectSelection = () => {
  return (
    <Grid container spacing={1}>
      <Grid container size={{ sm: 6 }} sx={{ alignItems: "baseline" }}>
        <SelectOrganisation />
      </Grid>
      <Grid container size={{ sm: 6 }} sx={{ alignItems: "baseline" }}>
        <SelectUnit userFilter={["none"]} />
      </Grid>
      <Grid container size={{ sm: 12 }} sx={{ alignItems: "baseline" }}>
        <SelectProject size="medium" />
      </Grid>
    </Grid>
  );
};
