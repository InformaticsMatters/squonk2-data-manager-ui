import type { DatasetVersionSummary } from "@squonk/data-manager-client";

import { List } from "@mui/material";
import { filesize } from "filesize";

import { toLocalTimeString } from "../../../../utils/app/datetime";
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
  const size = filesize(selectedVersion.size ?? 0);

  return (
    <List>
      <VersionInfoListItem name="Size" value={size === "0" ? undefined : size} />
      <VersionInfoListItem
        name="Published date"
        value={toLocalTimeString(selectedVersion.published, true, true)}
      />
    </List>
  );
};
