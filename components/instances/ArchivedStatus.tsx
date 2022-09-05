import InventoryIcon from "@mui/icons-material/Inventory";
import { ListItem, ListItemIcon, Tooltip } from "@mui/material";

export interface ArchivedStatusProps {
  archived: boolean;
}

export const ArchivedStatus = ({ archived }: ArchivedStatusProps) => {
  return archived ? (
    <Tooltip title="This instance won't be deleted automatically">
      <ListItem>
        <ListItemIcon sx={{ minWidth: "40px" }}>
          <InventoryIcon />
        </ListItemIcon>
      </ListItem>
    </Tooltip>
  ) : null;
};
