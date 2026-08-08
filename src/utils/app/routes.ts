import { projectLinks } from "../../projects/routes";
import { withBasePath } from "./basePath";

// Main source of truth for available *pages*
// Function used as value for dynamic routes

type Proxy = "" | "/api/dm-api" | "/api/viewer-proxy";

// Dataset version transports are owned by the Datasets family in `src/datasets/routes.ts`.
export const API_ROUTES = {
  projectFile: (projectId: string, path: string, fileName: string, proxy: Proxy = "") => {
    const params = new URLSearchParams({ file: fileName });
    path !== "" && params.set("path", path);
    return `${proxy}/project/${projectId}/file?${params.toString()}`;
  },
};

export const projectFileURL: (typeof API_ROUTES)["projectFile"] = (project, path, file) =>
  process.env.DATA_MANAGER_API_SERVER + API_ROUTES.projectFile(project, path, file);

/**
 * The absolute URL of one project, for a link that has to leave the application — a new tab, or a
 * message a caller may keep. It is the project's own canonical Files route, so an external link and
 * an internal one address the same project in the same way.
 */
export const projectURL = (projectId: string) =>
  globalThis.location.origin + withBasePath(projectLinks.files(projectId));
