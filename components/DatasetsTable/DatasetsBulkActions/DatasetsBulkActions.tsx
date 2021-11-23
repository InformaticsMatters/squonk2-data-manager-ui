import { css } from '@emotion/react';
import { Box, Typography } from '@material-ui/core';

import type { TableDatasetSubRow } from '..';
import { BulkDeleteButton } from './BulkDeleteButton';

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
      alignItems="center"
      css={
        !selectedDatasets.length
          ? css`
              visibility: hidden;
            `
          : undefined
      }
      display="flex"
      flex={1}
      justifyContent="space-between"
    >
      <Typography>Selected: {selectedDatasets.length}</Typography>
      <Box display="flex">
        <BulkDeleteButton selectedDatasets={selectedDatasets} />
      </Box>
    </Box>
  );
};
