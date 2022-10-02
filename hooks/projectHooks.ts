import { useGetProjects } from "@squonk/data-manager-client/project";

import { useRouter } from "next/router";

import { useIsAuthorized } from "./useIsAuthorized";
import { useKeycloakUser } from "./useKeycloakUser";

export type ProjectId = string | undefined;
export type ProjectLocalStoragePayload = { projectId: ProjectId; version: number };

export const projectPayload = (projectId: ProjectId) => ({ version: 1, projectId });

/**
 * @returns The selected projectId from the project key of the query parameters
 */
export const useCurrentProjectId = () => {
  const router = useRouter();
  const { query, pathname } = router;

  if (Array.isArray(query.project)) {
    throw new Error("Project is invalid");
  }
  const projectId = query.project;

  const setCurrentProjectId = (newProjectId?: string, shallow?: true) => {
    // Selected project is maintained via the URL "project" query parameter. We use next-js to update it.
    if (newProjectId !== undefined) {
      // A project has been selected
      router.push(
        {
          pathname,
          query: {
            ...query,
            project: newProjectId,
            path: projectId === newProjectId ? query.path : [],
          },
        },
        undefined,
        { shallow },
      );
    } else if (projectId !== undefined) {
      // The project has been cleared
      const newQuery = { ...query };
      delete newQuery.project;
      delete newQuery.path;

      router.push({ pathname, query: newQuery }, undefined, { shallow, scroll: false });
    }
  };

  return {
    projectId,
    setCurrentProjectId,
  };
};

/**
 * @returns The project associated with the project-id in the current url query parameters
 */
export const useCurrentProject = () => {
  const isAuthorized = useIsAuthorized();
  const { projectId } = useCurrentProjectId();
  const { data } = useGetProjects({ query: { enabled: !!isAuthorized } });
  const projects = data?.projects;

  return projects?.find((project) => project.project_id === projectId) ?? null;
};

/**
 * @param projectId Id of the project
 * @returns The project object matching the ID if it exists
 */
export const useProjectFromId = (projectId: string) => {
  const { data } = useGetProjects();

  const projects = data?.projects;

  return projects?.find((project) => project.project_id === projectId);
};

export const useIsUserAProjectOwnerOrEditor = () => {
  const { user } = useKeycloakUser();
  const project = useCurrentProject();

  return (
    !!user.username &&
    (project?.editors.includes(user.username) || project?.owner === user.username)
  );
};
