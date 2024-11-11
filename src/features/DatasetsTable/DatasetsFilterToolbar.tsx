import { Children, type ReactNode } from "react";

import { Box } from "@mui/material";

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
    <Box display="flex" flexWrap="wrap" gap={1} width="100%">
      {Children.map(shrinkableFilters, (child) => (
        <Box flex="1 1 200px">{child}</Box>
      ))}
      {Children.map(fullWidthFilters, (child) => (
        <Box flex="1 1 100%">{child}</Box>
      ))}
    </Box>
  );
};
