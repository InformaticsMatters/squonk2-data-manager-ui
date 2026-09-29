import { ExitToApp as ExitToAppIcon } from "@mui/icons-material";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import { useResultTask } from "../../../projects/useResultTask";

export interface ExitCodeFromTaskProps {
  taskId: string;
}

/**
 * The exit code the task that ran an instance reported. The task is read through the one owner of
 * the addressed task read, so it is the same read the instance's own task progress is shown from.
 */
export const ExitCodeFromTask = ({ taskId }: ExitCodeFromTaskProps) => {
  const read = useResultTask(taskId);
  const code = read.task?.exit_code;
  // The task read has neither answered nor failed, so its exit code is still arriving.
  const awaitingRead = read.task === undefined && read.readState.kind === "available";

  if (code === undefined && !awaitingRead) {
    return null;
  }

  return (
    <ListItem>
      <ListItemIcon sx={{ minWidth: "40px" }}>
        <ExitToAppIcon />
      </ListItemIcon>
      <ListItemText
        primary="Exit Code"
        secondary={awaitingRead ? "Loading..." : code}
        slotProps={
          awaitingRead
            ? undefined
            : { secondary: { sx: { color: code === 0 ? "green" : "error", fontWeight: "bold" } } }
        }
      />
    </ListItem>
  );
};
