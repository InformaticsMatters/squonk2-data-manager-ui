import { getGetTaskQueryOptions } from "@/api/data-manager/task";

import { type QueryClient } from "@tanstack/react-query";

import { DatasetTaskError, datasetTaskLifecycle, DatasetTaskPollingError } from "./mutations";

const pollIntervalMs = 500;
const pollLimit = 120;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/** The work a dataset command waits for, which is what its own failures are reported as. */
export type DatasetTaskAction = "Dataset attachment" | "Dataset deletion";

/**
 * Waits for one Data Manager task to settle, or says why it could not.
 *
 * A dataset deletion and a dataset attachment are both accepted long before they are done, and both
 * are only done when their task says so. Waiting is therefore the same act for either, and it lives
 * here so a command owner states the work it is waiting for rather than carrying a polling loop and
 * a settlement rule of its own. The generated task query options remain the sole cache identity of
 * the read, and a read that fails is left to its caller to classify: a transport failure is not an
 * outcome this task reported.
 */
export const awaitDatasetTask = async (
  queryClient: QueryClient,
  taskId: string,
  action: DatasetTaskAction,
): Promise<void> => {
  for (let attempt = 0; attempt < pollLimit; attempt += 1) {
    const task = await queryClient.fetchQuery({ ...getGetTaskQueryOptions(taskId), staleTime: 0 });
    const lifecycle = datasetTaskLifecycle(task);
    if (lifecycle.status === "succeeded") {
      return;
    }
    if (lifecycle.status === "failed") {
      throw new DatasetTaskError(
        `${action} task failed${
          lifecycle.exitCode === undefined ? "" : ` with exit code ${lifecycle.exitCode}`
        }.`,
        taskId,
      );
    }
    await wait(pollIntervalMs);
  }
  throw new DatasetTaskPollingError(`${action} is still in progress.`, taskId);
};

/** The tasks a command has had accepted, kept by the identity of the work each of them is doing. */
export type AcceptedDatasetTasks = Map<string, string>;

/**
 * Sends one command that the Data Manager answers with a task, and waits for that task to settle.
 *
 * Work already accepted is remembered by its own identity, so a retry after a failure this client
 * could not interpret waits on the task that work already has rather than asking for it a second
 * time. Only a task that actually settled — as a success or as a failure the Data Manager reported
 * — releases the identity, because those are the only answers that say the work is over.
 */
export const settleDatasetTask = async ({
  accepted,
  action,
  identity,
  queryClient,
  send,
}: {
  accepted: AcceptedDatasetTasks;
  action: DatasetTaskAction;
  identity: string;
  queryClient: QueryClient;
  send: () => Promise<string>;
}): Promise<string> => {
  let taskId = accepted.get(identity);
  if (!taskId) {
    taskId = await send();
    accepted.set(identity, taskId);
  }
  try {
    await awaitDatasetTask(queryClient, taskId, action);
  } catch (error) {
    if (error instanceof DatasetTaskError) {
      accepted.delete(identity);
    }
    throw error;
  }
  accepted.delete(identity);
  return taskId;
};
