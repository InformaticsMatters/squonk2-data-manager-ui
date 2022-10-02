import type { ProjectDetail } from "@squonk/data-manager-client";

import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import { useSnackbar } from "notistack";

import { projectURL } from "../../utils/app/routes";

export interface CopyProjectURLProps {
  /**
   * Project to copy the permalink to the clipboard
   */
  project: ProjectDetail;
}

export const CopyProjectURL = ({ project }: CopyProjectURLProps) => {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <Tooltip title="Copy link to project">
      <IconButton
        size="small"
        sx={{ p: "1px" }}
        onClick={async () => {
          project.project_id &&
            (await navigator.clipboard.writeText(projectURL(project.project_id)));
          enqueueSnackbar("Copied URL to clipboard", { variant: "info" });
        }}
      >
        <ShareIcon />
      </IconButton>
    </Tooltip>
  );
};
