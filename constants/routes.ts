// Main source of truth for available *pages*
// Function used as value for dynamic routes

import { DM_API_URL } from ".";

export const APP_ROUTES = {
  home: "/",
  datasets: "/datasets",
  project: {
    ".": "/project",
    file: "/project/file",
  },
  executions: "/executions",
  results: {
    ".": "/results",
    task: (taskId: string) => `/results/task/${taskId}`,
    instance: (instanceId: string) => `/results/instance/${instanceId}`,
  },
  dataset: {
    ".": "/dataset",
    version: (datasetId: string, datasetVersion: number) =>
      `/dataset/${datasetId}/${datasetVersion}`,
  },
};

export const API_ROUTES = {
  projectFile: (projectId: string, path: string, fileName: string) =>
    `${DM_API_URL}/project/${projectId}/file?path=${path}&file=${fileName}`,
  datasetVersion: (datasetId: string, version: number) =>
    `${DM_API_URL}/dataset/${datasetId}/${version}`,
};
