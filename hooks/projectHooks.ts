import { useGetProjects } from "@squonk/data-manager-client/project";

import { useRouter } from "next/router";

import { PROJECT_LOCAL_STORAGE_KEY } from "../constants";
import { writeToLocalStorage } from "../utils/localStorage";
import { useKeycloakUser } from "./useKeycloakUser";

export type ProjectId = string | undefined;
export type ProjectLocalStoragePayload = { projectId: ProjectId; version: number };

/**
 * @returns The selected projectId from the project key of the query parameters
 */
export const useCurrentProjectId = () => {
  const router = useRouter();

  const projectId = router.query.project as ProjectId;

  const setCurrentProjectId = (newProjectId?: string, shallow?: true) => {
    writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, {
      version: 1,
      projectId: newProjectId,
    });

    // Selected project is maintained via the URL "project" query parameter. We use next-js to update it.
    if (newProjectId !== undefined) {
      // A project has been selected
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            project: newProjectId,
            path: projectId === newProjectId ? router.query.path : [],
          },
        },
        undefined,
        { shallow },
      );
    } else {
      // The project has been cleared
      const newQuery = { ...router.query };
      delete newQuery.project;
      delete newQuery.path;

      router.push(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow },
      );
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
  const { projectId } = useCurrentProjectId();
  const { data } = useGetProjects();
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
