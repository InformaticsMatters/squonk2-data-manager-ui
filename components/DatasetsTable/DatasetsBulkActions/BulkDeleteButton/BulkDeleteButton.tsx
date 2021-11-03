import { useQueryClient } from 'react-query';

import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import { IconButton, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { DeleteForever } from '@material-ui/icons';

import { WarningDeleteButton } from '../../../WarningDeleteButton';
import type { TableDataset } from '../..';
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
  selectedDatasets: TableDataset[];
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

  const deleteSelectedDatasets = async () => {
    const promises = deletableDatasets
      // In case a non sub row (without version) slips in here
      .filter((dataset) => dataset.version !== undefined)
      .map((dataset) =>
        // Since the array has been filtered to not include items without a version number, this
        // is safe
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        deleteDataset({ datasetid: dataset.dataset_id, datasetversion: dataset.version! }),
      );

    await Promise.all(promises);

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
