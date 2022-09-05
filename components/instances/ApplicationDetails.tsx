import type { InstanceSummary } from "@squonk/data-manager-client";

import { ListItem, ListItemText } from "@mui/material";

import { usePolledGetInstance } from "../../hooks/usePolledGetInstance";
import { CenterLoader } from "../CenterLoader";
import { HorizontalList } from "../HorizontalList";
import { TaskDetails } from "../tasks/TaskDetails";

export interface ApplicationDetailsProps {
  /**
   * ID of the instance of the application
   */
  instanceId: InstanceSummary["id"];
}

/**
 * Displays the details of an application based on the ID of an application instance
 */
export const ApplicationDetails = ({ instanceId }: ApplicationDetailsProps) => {
  const { data: instance } = usePolledGetInstance(instanceId);

  const tasks = instance?.tasks;
  const task = tasks?.[tasks.length - 1];

  if (instance === undefined) {
    return <CenterLoader />;
  }

  return (
    <>
      <HorizontalList>
        <ListItem>
          <ListItemText
            primary={instance.application_id}
            secondary={instance.application_version}
          />
        </ListItem>
      </HorizontalList>

      <TaskDetails taskId={task?.id ?? ""} />
    </>
  );
};
