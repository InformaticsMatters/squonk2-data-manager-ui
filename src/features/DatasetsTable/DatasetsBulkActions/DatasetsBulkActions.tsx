import { Box, Typography } from "@mui/material";

import { type TableDatasetSubRow } from "..";
import { BulkDeleteButton } from "./BulkDeleteButton";

export interface DatasetsBulkActionsProps {
  /**
   * Selected datasets versions from DatasetsTable.
   */
  selectedDatasets: TableDatasetSubRow[];
}

/**
 * Custom bulk action toolbar for selected datasets versions. It displays the number of selected
 * datasets versions (sub rows from DatasetsTable).
 */
export const DatasetsBulkActions = ({ selectedDatasets }: DatasetsBulkActionsProps) => {
  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        flex: 1,
        justifyContent: "space-between",
        visibility: selectedDatasets.length === 0 ? "hidden" : undefined,
      }}
    >
      <Typography>Selected: {selectedDatasets.length}</Typography>
      <Box sx={{ display: "flex" }}>
        <BulkDeleteButton selectedDatasets={selectedDatasets} />
      </Box>
    </Box>
  );
};
