import { useGetProjects } from "@squonk/data-manager-client/project";

import { useRouter } from "next/router";

import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../utils/next/localStorage";
import { useDMAuthorizationStatus } from "./useIsAuthorized";
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
    throw new TypeError("Project is invalid");
  }
  const projectId = query.project;

  const setCurrentProjectId = (newProjectId?: string, shallow?: true) => {
    // Selected project is maintained via the URL "project" query parameter. We use next-js to update it.
    if (newProjectId !== undefined) {
      // A project has been selected
      const href = {
        pathname,
        query: {
          ...query,
          project: newProjectId,
          path: projectId === newProjectId ? query.path : [],
        },
      };

      void router.push(href, undefined, { shallow });
    } else if (projectId !== undefined) {
      // The project has been cleared
      const newQuery = { ...query };
      delete newQuery.project;
      delete newQuery.path;

      const href = { pathname, query: newQuery };
      writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, projectPayload(undefined));
      void router.push(href, undefined, { shallow, scroll: false });
    }
  };

  return { projectId, setCurrentProjectId };
};

/**
 * @returns The project associated with the project-id in the current url query parameters
 */
export const useCurrentProject = () => {
  const isDMAuthorized = useDMAuthorizationStatus();
  const { projectId } = useCurrentProjectId();
  const { data } = useGetProjects(undefined, { query: { enabled: !!isDMAuthorized } });
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

export const useIsUserAdminOrEditorOfCurrentProject = () => {
  const { user } = useKeycloakUser();
  const project = useCurrentProject();

  return (
    !!user.username &&
    (!!project?.editors.includes(user.username) ||
      !!project?.administrators.includes(user.username))
  );
};

export const useIsEditorOfCurrentProject = () => {
  const currentProject = useCurrentProject();

  const { user } = useKeycloakUser();
  const isEditor = !!user.username && currentProject?.editors.includes(user.username);

  return isEditor;
};
