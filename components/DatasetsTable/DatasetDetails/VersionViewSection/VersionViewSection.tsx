import type { DatasetSummary, DatasetVersionSummary } from "@squonk/data-manager-client";

import { Description } from "@mui/icons-material";
import { List, ListItem, ListItemText } from "@mui/material";

import { API_ROUTES } from "../../../../constants/routes";
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
      <ListItem
        button
        component="a"
        href={API_ROUTES.datasetVersion(dataset.dataset_id, version.version, true)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ListItemText
          primary="Browser Viewer"
          secondary="Displays the file in your browser if it supports the file type"
        />
        <Description color="action" />
      </ListItem>
    </List>
  );
};
