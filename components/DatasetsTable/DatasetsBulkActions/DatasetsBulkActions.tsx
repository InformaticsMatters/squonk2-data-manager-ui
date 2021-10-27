import { Box, Typography } from '@material-ui/core';

import type { TableDataset } from '..';
import { BulkDeleteButton } from './BulkDeleteButton';

export interface DatasetsBulkActionsProps {
  /**
   * Selected datasets versions from DatasetsTable.
   */
  selectedDatasets: TableDataset[];
}

/**
 * Custom bulk action toolbar for selected datasets versions. It displays the number of selected
 * datasets versions (sub rows from DatasetsTable).
 */
export const DatasetsBulkActions = ({ selectedDatasets }: DatasetsBulkActionsProps) => {
  return selectedDatasets.length ? (
    <Box alignItems="center" display="flex" flex={1} justifyContent="space-between">
      <Typography>Selected: {selectedDatasets.length}</Typography>
      <Box display="flex">
        <BulkDeleteButton selectedDatasets={selectedDatasets} />
      </Box>
    </Box>
  ) : null;
};
