import type { DatasetSummary, DatasetVersionSummary } from '@squonk/data-manager-client';

import { List } from '@material-ui/core';

import { AttachDatasetListItem } from './AttachDatasetListItem';
import { DatasetSchemaListItem } from './DatasetSchemaListItem';
import { DeleteDatasetListItem } from './DeleteDatasetListItem';

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
   * Setter to set the selected version.
   */
  setVersion: (version: DatasetVersionSummary) => void;
  /**
   * Whether the dataset version is editable.
   */
  editable: boolean;
}

/**
 * Displays 'Actions' section in Dataset Details.
 */
export const VersionActionsSection = ({
  dataset,
  version,
  setVersion,
  editable,
}: VersionActionsSectionProps) => {
  return (
    <>
      {/* More complex actions requiring a new context */}

      <List>
        <AttachDatasetListItem datasetId={dataset.dataset_id} version={version} />

        <DatasetSchemaListItem datasetId={dataset.dataset_id} version={version.version} />

        {editable && (
          <DeleteDatasetListItem
            datasetId={dataset.dataset_id}
            version={version}
            onDelete={() => {
              // Reset selected version as it is being deleted
              const nextSelectableVersions = dataset.versions.filter(
                (version) => version.version !== version.version,
              );
              if (nextSelectableVersions.length > 0) {
                setVersion(nextSelectableVersions[0]);
              }
            }}
          />
        )}
      </List>
    </>
  );
};
