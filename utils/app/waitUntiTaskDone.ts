import { getTask } from "@squonk/data-manager-client/task";

/**
 * Waits for a task's `done` property to be `true`.
 *
 * The returned `Promise` resolves when this is true.
 * @param taskId ID of the task
 * @param refetchInterval how often to refetch
 * @returns An empty promise
 */
export const waitUntilTaskDone = async (taskId: string, refetchInterval = 1000) => {
  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      getTask(taskId)
        .then((task) => {
          if (task.done) {
            resolve();
            clearInterval(interval);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }, refetchInterval);
  });
};
