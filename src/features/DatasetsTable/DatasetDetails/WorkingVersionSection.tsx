import { type DatasetSummary, type DatasetVersionSummary } from "@squonk/data-manager-client";

import { Box, MenuItem, TextField, Typography } from "@mui/material";

import { DownloadButton } from "../../../components/downloads/DownloadButton";
import { API_ROUTES } from "../../../utils/app/routes";

export interface WorkingVersionSectionProps {
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
}

/**
 * Displays 'Working Version' section in Dataset Details.
 */
export const WorkingVersionSection = ({
  dataset,
  version,
  setVersion,
}: WorkingVersionSectionProps) => {
  return (
    <>
      <Typography gutterBottom variant="body1">
        The options below affect this version
      </Typography>
      {/* Display the download button next to the version select */}
      <Box alignItems="center" display="flex" marginY={1}>
        {/* Main version selection - this controls the target version for this whole modal */}
        <TextField
          fullWidth
          select
          label="Select a version"
          size="medium"
          value={version.version}
          onChange={(event) => {
            const version = dataset.versions.find(
              (version) => version.version === Number(event.target.value),
            );
            version && setVersion(version);
          }}
        >
          {dataset.versions.map((version) => (
            <MenuItem
              key={version.version}
              value={version.version}
            >{`v${version.version}`}</MenuItem>
          ))}
        </TextField>

        {/* Download Dataset Version */}
        <Box ml={2}>
          <DownloadButton
            disabled={!(version.processing_stage === "DONE")}
            href={API_ROUTES.datasetVersion(dataset.dataset_id, version.version, "/api/dm-api")}
            title="Download this version of the dataset"
          />
        </Box>
      </Box>
    </>
  );
};
