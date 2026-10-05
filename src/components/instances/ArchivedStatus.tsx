import { ListItem, ListItemIcon, Tooltip } from "@mui/material";

import { ArchiveIcon } from "../icons";

export interface ArchivedStatusProps {
  archived: boolean;
}

export const ArchivedStatus = ({ archived }: ArchivedStatusProps) => {
  return archived ? (
    <Tooltip title="This instance won't be deleted automatically">
      <ListItem>
        <ListItemIcon sx={{ minWidth: "40px" }}>
          <ArchiveIcon />
        </ListItemIcon>
      </ListItem>
    </Tooltip>
  ) : null;
};
