import { type DmError } from "@/api/data-manager";

import { DeleteForever } from "@mui/icons-material";
import { IconButton, List, ListItem, ListItemText, Typography } from "@mui/material";

import { WarningDeleteButton } from "../../../../components/WarningDeleteButton";
import { useDatasetCommands } from "../../../../datasets/useDatasetCommands";
import { useEnqueueError } from "../../../../hooks/useEnqueueStackError";
import { type TableDataset, type TableDatasetSubRow } from "../..";
import { useFilterDeletableDatasets } from "./useFilterDeletableDatasets";
import { useSortUndeletableDatasets } from "./useSortUndeletableDatasets";

const formatVersionsString = (datasetGroup: TableDataset[]) => {
  const versionString = datasetGroup.length > 1 ? "Versions" : "Version";
  return `${versionString} ${datasetGroup.map((dataset) => dataset.version).join(", ")}`;
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
  const { deleteVersion } = useDatasetCommands();

  const { deletableDatasets, undeletableDatasets } = useFilterDeletableDatasets(selectedDatasets);
  const sortedUndeletableDatasets = useSortUndeletableDatasets(undeletableDatasets);

  const { enqueueSnackbar } = useEnqueueError<DmError>();

  const deleteSelectedDatasets = async () => {
    const reasons: unknown[] = [];
    const orderedDatasets = deletableDatasets.toSorted(
      (left, right) =>
        left.dataset_id.localeCompare(right.dataset_id) || right.version - left.version,
    );
    for (const dataset of orderedDatasets) {
      try {
        await deleteVersion(dataset.dataset_id, dataset.version);
      } catch (error) {
        reasons.push(error);
      }
    }

    if (reasons.length > 0) {
      enqueueSnackbar(`${reasons.length} dataset(s) could not be deleted`, { variant: "warning" });
    } else if (orderedDatasets.length === 0) {
      enqueueSnackbar("No selected dataset versions are available for deletion", {
        variant: "warning",
      });
    } else {
      enqueueSnackbar("Datasets deleted successfully", { variant: "success" });
    }
  };

  return (
    <WarningDeleteButton
      modalChildren={
        <>
          <Typography>
            Are you sure? <b>This cannot be undone</b>.
          </Typography>
          {sortedUndeletableDatasets.length > 0 && (
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
      modalId="delete-selected-datasets"
      title="Delete selected"
      tooltipText="Delete selected datasets"
      onDelete={deleteSelectedDatasets}
    >
      {({ isDeleting, openModal }) => (
        <IconButton
          aria-label="Delete selected datasets"
          disabled={isDeleting}
          size="large"
          onClick={openModal}
        >
          <DeleteForever />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
