import { type InstanceGetResponse } from "@/api/data-manager";

import { HorizontalList } from "../HorizontalList";
import { TaskDetails } from "../tasks/TaskDetails";
import { CommonDetails } from "./JobDetails/CommonDetails";

export interface InstanceOverviewProps {
  /** The addressed instance's own read; nothing here is fetched a second time. */
  instance: InstanceGetResponse;
}

/**
 * What every instance records, whatever it ran: what it has spent, the application it is an
 * instance of, and what the task that created it did. It is all an application accounts for, and
 * all an instance of a type this client has no rule for can be said to account for either.
 */
export const InstanceOverview = ({ instance }: InstanceOverviewProps) => {
  const task = instance.tasks.at(-1);

  return (
    <>
      <HorizontalList>
        <CommonDetails instance={instance} />
      </HorizontalList>

      {!!task && <TaskDetails taskId={task.id} />}
    </>
  );
};
