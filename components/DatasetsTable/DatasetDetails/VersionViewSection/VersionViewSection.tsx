import type { DatasetSummary, DatasetVersionSummary } from "@squonk/data-manager-client";

import { List } from "@mui/material";

import { DatasetPlainTextViewerListItem } from "./DatasetPlainTextViewerListItem";

export interface VersionViewSectionProps {
  /**
   * A dataset `version` belongs to.
   */
  dataset: DatasetSummary;
  /**
   * A selected dataset version.
   */
  version: DatasetVersionSummary;
}

/**
 * Displays 'View' section in Dataset Details.
 */
export const VersionViewSection = ({ dataset, version }: VersionViewSectionProps) => {
  return (
    <List>
      <DatasetPlainTextViewerListItem datasetId={dataset.dataset_id} version={version.version} />
    </List>
  );
};
