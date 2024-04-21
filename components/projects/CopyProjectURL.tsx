import { type ProjectDetail } from "@squonk/data-manager-client";

import { Share as ShareIcon } from "@mui/icons-material";
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

  const copyURLHandler = async () => {
    project.project_id && (await navigator.clipboard.writeText(projectURL(project.project_id)));
    enqueueSnackbar("Copied URL to clipboard", { variant: "info" });
  };

  return (
    <Tooltip title="Copy link to project">
      <IconButton size="small" sx={{ p: "1px" }} onClick={() => void copyURLHandler()}>
        <ShareIcon />
      </IconButton>
    </Tooltip>
  );
};
