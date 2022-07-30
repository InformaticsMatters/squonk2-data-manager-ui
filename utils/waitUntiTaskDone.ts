import { getTask } from "@squonk/data-manager-client/task";

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
