// Main source of truth for available *pages*
// Function used as value for dynamic routes

type Proxy = "" | "/api/dm-api" | "/api/viewer-proxy";

export const API_ROUTES = {
  projectFile: (projectId: string, path: string, fileName: string, proxy: Proxy = "") => {
    const params = new URLSearchParams({ file: fileName });
    path !== "" && params.set("path", path);
    return `${proxy}/project/${projectId}/file?${params.toString()}`;
  },
  datasetVersion: (datasetId: string, version: number, proxy: Proxy = "") =>
    `${proxy}/dataset/${datasetId}/${version}`,
};

export const projectFileURL: (typeof API_ROUTES)["projectFile"] = (project, path, file) =>
  process.env.DATA_MANAGER_API_SERVER + API_ROUTES.projectFile(project, path, file);

export const projectURL = (projectId: string) =>
  globalThis.location.origin +
  (process.env.NEXT_PUBLIC_BASE_PATH ?? "") +
  "/project?" +
  new URLSearchParams([["project", projectId]]).toString();
