import type { ReactNode } from "react";
import { Children } from "react";

import { Grid } from "@mui/material";

export interface DatasetsFilterToolbarProps {
  /**
   * Filter which can be shrinked and placed alongside other filters in one row.
   */
  shrinkableFilters?: ReactNode | ReactNode[];
  /**
   * Filter which should occupy one whole row.
   */
  fullWidthFilters?: ReactNode | ReactNode[];
}

/**
 * Wraps elements in the DataTable toolbar and adds spacing between them. Filters are categorized
 * into 2 groups - those which can be shrinked and placed alongside other filters, and those which
 * should occupy one whole row.
 */
export const DatasetsFilterToolbar = ({
  shrinkableFilters,
  fullWidthFilters,
}: DatasetsFilterToolbarProps) => {
  return (
    <Grid container alignItems="center" spacing={1} sx={{ mr: 7 }}>
      {Children.map(shrinkableFilters, (child) => (
        <Grid item sx={{ flex: "1 1 200px" }}>
          {child}
        </Grid>
      ))}
      {Children.map(fullWidthFilters, (child) => (
        <Grid item sx={{ flex: "1 1 100%" }}>
          {child}
        </Grid>
      ))}
    </Grid>
  );
};
