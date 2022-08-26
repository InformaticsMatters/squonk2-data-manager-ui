import { getTask } from "@squonk/data-manager-client/task";

/**
 * Waits for a task's `done` property to be `true`.
 *
 * The returned `Promise` resolves when this is true.
 * @param taskId ID of the task
 * @param refetchInterval how often to refetch
 * @returns An empty promise
 */
export async function waitUntilTaskDone(taskId: string, refetchInterval = 1000) {
  return await new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      const task = await getTask(taskId);
      if (task.done) {
        resolve();
        clearInterval(interval);
      }
    }, refetchInterval);
  });
}
