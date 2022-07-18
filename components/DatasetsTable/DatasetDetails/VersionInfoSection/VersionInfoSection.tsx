import type { DatasetVersionSummary } from "@squonk/data-manager-client";

import { List } from "@mui/material";
import fileSize from "filesize";

import { toLocalTimeString } from "../../../LocalTime";
import { VersionInfoListItem } from "./VersionInfoListItem";

export interface VersionInfoSectionProps {
  /**
   * A selected dataset version.
   */
  version: DatasetVersionSummary;
}

/**
 * Displays 'Information' section in Dataset Details.
 */
export const VersionInfoSection = ({ version: selectedVersion }: VersionInfoSectionProps) => {
  return (
    <List>
      <VersionInfoListItem
        name="Size"
        value={selectedVersion.size ? fileSize(selectedVersion.size) : undefined}
      />
      <VersionInfoListItem
        name="Published date"
        value={toLocalTimeString(selectedVersion.published, true, true)}
      />
    </List>
  );
};
