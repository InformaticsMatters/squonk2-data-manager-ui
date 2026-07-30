import { type ParsedUrlQuery } from "node:querystring";

export type ProjectFilesRoute = { name: "project-files"; projectId: string };

export const parseProjectFilesRoute = (query: ParsedUrlQuery): ProjectFilesRoute | null => {
  if (typeof query.projectId !== "string" || query.projectId.length === 0) {
    return null;
  }
  return { name: "project-files", projectId: query.projectId };
};

export const projectFilesHref = (projectId: string) => `/projects/${projectId}/files` as const;
