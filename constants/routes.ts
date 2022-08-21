// Main source of truth for available *pages*
// Function used as value for dynamic routes

type Proxy = "/api/dm-api" | "/api/viewer-proxy" | "";

export const API_ROUTES = {
  projectFile: (projectId: string, path: string, fileName: string, proxy: Proxy = "") =>
    `${proxy}/project/${projectId}/file?path=${encodeURIComponent(path)}&file=${encodeURIComponent(
      fileName,
    )}`,
  datasetVersion: (datasetId: string, version: number, proxy: Proxy = "") =>
    `${proxy}/dataset/${datasetId}/${version}`,
};
