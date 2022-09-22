import { Grid } from "@mui/material";

import { SelectOrganisation } from "../../../../components/userContext/SelectOrganisation";
import { SelectUnit } from "../../../../components/userContext/SelectUnit";
import { ContextActions } from "./ContextActions";

/**
 * Displays `Context` section in User Settings.
 */
export const ContextSection = () => {
  return (
    <>
      <Grid container spacing={1}>
        <Grid container item sm={6}>
          <SelectOrganisation />
        </Grid>
        <Grid container item sm={6}>
          <SelectUnit />
        </Grid>
      </Grid>
      <ContextActions />
    </>
  );
};
