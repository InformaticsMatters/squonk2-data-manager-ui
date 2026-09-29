import { projectLinks } from "../../projects/routes";
import { withBasePath } from "./basePath";

// Project file and dataset version transports are owned by their own families in
// `src/projects/routes.ts` and `src/datasets/routes.ts`.

/**
 * The absolute URL of one project, for a link that has to leave the application — a new tab, or a
 * message a caller may keep. It is the project's own canonical Files route, so an external link and
 * an internal one address the same project in the same way.
 */
export const projectURL = (projectId: string) =>
  globalThis.location.origin + withBasePath(projectLinks.files(projectId));
