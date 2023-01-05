import { OpenInBrowser as OpenInBrowserIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { projectURL } from "../../utils/app/routes";

export interface OpenProjectButtonProps {
  projectId: string;
}

export const OpenProjectButton = ({ projectId }: OpenProjectButtonProps) => {
  return (
    <Tooltip title="Open project in a new tab">
      <IconButton href={projectURL(projectId)} size="small" sx={{ p: "1px" }} target="_blank">
        <OpenInBrowserIcon />
      </IconButton>
    </Tooltip>
  );
};
