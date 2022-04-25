import { useQueryClient } from 'react-query';

import type { DmError } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import { IconButton, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { DeleteForever } from '@material-ui/icons';

import { useEnqueueError } from '../../../../hooks/useEnqueueStackError';
import { WarningDeleteButton } from '../../../WarningDeleteButton';
import type { TableDataset, TableDatasetSubRow } from '../..';
import { useFilterDeletableDatasets } from './useFilterDeletableDatasets';
import { useSortUndeletableDatasets } from './useSortUndeletableDatasets';

const formatVersionsString = (datasetGroup: TableDataset[]) => {
  const versionString = datasetGroup.length > 1 ? 'Versions' : 'Version';
  return `${versionString} ${datasetGroup.map((dataset) => dataset.version).join(', ')}`;
};

export interface BulkDeleteButtonProps {
  /**
   * Selected datasets versions from DatasetsTable.
   */
  selectedDatasets: TableDatasetSubRow[];
}

/**
 * A button which triggers the deletion of selected datasets versions. Upon clicking it displays a
 * confirm dialog potentially with the list of datasets a user has no permission to delete.
 */
export const BulkDeleteButton = ({ selectedDatasets }: BulkDeleteButtonProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteDataset } = useDeleteDataset();

  const { deletableDatasets, undeletableDatasets } = useFilterDeletableDatasets(selectedDatasets);
  const sortedUndeletableDatasets = useSortUndeletableDatasets(undeletableDatasets);

  const { enqueueSnackbar } = useEnqueueError<DmError>();

  const deleteSelectedDatasets = async () => {
    const promises = deletableDatasets.map((dataset) =>
      deleteDataset({ datasetId: dataset.dataset_id, datasetVersion: dataset.version }),
    );

    const reasons = (await Promise.allSettled(promises))
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((rejected) => rejected.reason);

    if (reasons.length > 0) {
      enqueueSnackbar(`${reasons.length} dataset(s) could not be deleted`, { variant: 'warning' });
    } else {
      enqueueSnackbar('Datasets deleted successfully', { variant: 'success' });
    }

    await queryClient.invalidateQueries(getGetDatasetsQueryKey());
  };

  return (
    <WarningDeleteButton
      modalChildren={
        <>
          <Typography>
            Are you sure? <b>This cannot be undone</b>.
          </Typography>
          {!!sortedUndeletableDatasets.length && (
            <>
              <br />
              <Typography>
                These datasets will not be deleted because you do not have sufficient permissions to
                delete them:
              </Typography>
              <List disablePadding>
                {sortedUndeletableDatasets.map((datasetGroup) => (
                  <ListItem key={datasetGroup[0].dataset_id}>
                    <ListItemText
                      primary={`${
                        datasetGroup[0].datasetSummary.versions[0].file_name
                      } - ${formatVersionsString(datasetGroup)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      }
      modalId={'delete-selected-datasets'}
      title={'Delete selected'}
      tooltipText="Delete selected datasets"
      onDelete={deleteSelectedDatasets}
    >
      {({ isDeleting, openModal }) => (
        <IconButton aria-label="Delete selected datasets" disabled={isDeleting} onClick={openModal}>
          <DeleteForever />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
