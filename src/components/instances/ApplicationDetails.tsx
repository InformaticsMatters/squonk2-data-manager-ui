import { type InstanceSummary } from "@squonk/data-manager-client";

import { usePolledGetInstance } from "../../hooks/usePolledGetInstance";
import { CenterLoader } from "../CenterLoader";
import { HorizontalList } from "../HorizontalList";
import { TaskDetails } from "../tasks/TaskDetails";
import { CommonDetails } from "./JobDetails/CommonDetails";

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
  const task = tasks?.at(-1);

  if (instance === undefined) {
    return <CenterLoader />;
  }

  return (
    <>
      <HorizontalList>
        <CommonDetails instance={instance} />
      </HorizontalList>

      <TaskDetails taskId={task?.id ?? ""} />
    </>
  );
};
