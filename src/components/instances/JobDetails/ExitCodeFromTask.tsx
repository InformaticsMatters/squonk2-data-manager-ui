import { useGetTask } from "@squonk/data-manager-client/task";

import { ExitToApp as ExitToAppIcon } from "@mui/icons-material";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

export interface ExitCodeFromTaskProps {
  taskId: string;
}

export const ExitCodeFromTask = ({ taskId }: ExitCodeFromTaskProps) => {
  const { data: code, isLoading } = useGetTask(taskId, undefined, {
    query: { select: (data) => data.exit_code },
  });

  if (code === undefined && !isLoading) {
    return null;
  }

  return (
    <ListItem>
      <ListItemIcon sx={{ minWidth: "40px" }}>
        <ExitToAppIcon />
      </ListItemIcon>
      <ListItemText
        primary="Exit Code"
        secondary={isLoading ? "Loading..." : code}
        slotProps={
          isLoading
            ? undefined
            : { secondary: { color: code === 0 ? "green" : "error", fontWeight: "bold" } }
        }
      />
    </ListItem>
  );
};
