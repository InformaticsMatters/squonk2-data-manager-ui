import type { ProjectDetail } from "@squonk/data-manager-client";

import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";

export interface CopyProjectURLProps {
  /**
   * Project to copy the permalink to the clipboard
   */
  project: ProjectDetail;
}

export const CopyProjectURL = ({ project }: CopyProjectURLProps) => {
  return (
    <Tooltip title="Copy link to project">
      <IconButton
        size="small"
        sx={{ p: "1px" }}
        onClick={() => {
          project.project_id &&
            navigator.clipboard.writeText(
              window.location.origin +
                (process.env.NEXT_PUBLIC_BASE_PATH ?? "") +
                "/project?" +
                new URLSearchParams([["project", project.project_id]]).toString(),
            );
        }}
      >
        <ShareIcon />
      </IconButton>
    </Tooltip>
  );
};
