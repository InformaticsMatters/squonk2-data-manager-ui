import { Grid } from "@mui/material";

import { type PermissionLevelFilter } from "../../../../components/userContext/filter";
import { SelectOrganisation } from "../../../../components/userContext/SelectOrganisation";
import { SelectUnit } from "../../../../components/userContext/SelectUnit";
import { OrganisationActions } from "./contextActions/OrganisationActions";
import { UnitActions } from "./contextActions/UnitActions";

export interface ContextSectionProps {
  userFilter: PermissionLevelFilter;
}

/**
 * Displays `Context` section in User Settings.
 */
export const ContextSection = ({ userFilter }: ContextSectionProps) => {
  return (
    <Grid container spacing={1}>
      <Grid container item alignContent="flex-start" sm={6}>
        <SelectOrganisation />
        <OrganisationActions />
      </Grid>
      <Grid container item alignContent="flex-start" sm={6}>
        <SelectUnit userFilter={userFilter} />
        <UnitActions />
      </Grid>
    </Grid>
  );
};
