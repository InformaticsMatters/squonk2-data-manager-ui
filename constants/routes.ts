// Main source of truth for available *pages*
// Function used as value for dynamic routes

export const APP_ROUTES = {
  home: `/`,
  datasets: `/datasets`,
  project: {
    '.': `/project`,
    file: `/project/file`,
  },
  executions: `/executions`,
  results: {
    '.': `/results`,
    task: (taskId: string) => `/results/task/${taskId}`,
    instance: (instanceId: string) => `/results/instance/${instanceId}`,
  },
  dataset: {
    '.': `/dataset`,
    version: (datasetId: string, datasetVersion: number) =>
      `/dataset/${datasetId}/${datasetVersion}`,
  },
};
