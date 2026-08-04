import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

import { List } from "@mui/material";

import { type DatasetCapability } from "../../../../datasets/capabilities";
import { type DatasetDeletionDestination } from "../../../../datasets/mutations";
import { AttachDatasetListItem } from "./AttachDatasetListItem";
import { DatasetSchemaListItem } from "./DatasetSchemaListItem";
import { DeleteDatasetListItem } from "./DeleteDatasetListItem";

export interface VersionActionsSectionProps {
  /**
   * A dataset `version` belongs to.
   */
  dataset: DatasetSummary;
  /**
   * A selected dataset version.
   */
  version: DatasetVersionSummary;
  /**
   * Navigates to another available version.
   */
  onVersionDeleted: (next: DatasetDeletionDestination) => void;
  /**
   * Whether the dataset version is editable.
   */
  deletionCapability: DatasetCapability;
}

/**
 * Displays 'Actions' section in Dataset Details.
 */
export const VersionActionsSection = ({
  dataset,
  version,
  onVersionDeleted,
  deletionCapability,
}: VersionActionsSectionProps) => {
  return (
    <>
      {/* More complex actions requiring a new context */}

      <List>
        <AttachDatasetListItem datasetId={dataset.dataset_id} version={version} />

        <DatasetSchemaListItem datasetId={dataset.dataset_id} version={version.version} />

        <DeleteDatasetListItem
          capability={deletionCapability}
          datasetId={dataset.dataset_id}
          version={version}
          onDeleted={onVersionDeleted}
        />
      </List>
    </>
  );
};
