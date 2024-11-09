import { useGetTask } from "@squonk/data-manager-client/task";

import { ExitToApp as ExitToAppIcon } from "@mui/icons-material";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

export interface ExitCodeFromTaskProps {
  taskId: string;
}

export const ExitCodeFromTask = ({ taskId }: ExitCodeFromTaskProps) => {
  const { data } = useGetTask(taskId);
  const code = data?.exit_code;

  return (
    <ListItem>
      <ListItemIcon sx={{ minWidth: "40px" }}>
        <ExitToAppIcon />
      </ListItemIcon>
      <ListItemText
        primary="Exit Code"
        secondary={code}
        secondaryTypographyProps={{
          color: code === 0 ? "green" : "error",
          fontWeight: "bold",
        }}
      />
    </ListItem>
  );
};
