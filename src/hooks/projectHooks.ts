import { type ProjectDetail } from "@squonk/data-manager-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import { useRouter } from "next/router";

import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../utils/next/localStorage";
import { useDMAuthorizationStatus } from "./useIsAuthorized";
import { useKeycloakUser } from "./useKeycloakUser";

// --- Composable role-checking API ---
export type ProjectRole = "administrator" | "creator" | "editor" | "observer";

export const hasProjectRole = (
  project: ProjectDetail | null,
  username: string | undefined,
  roles: ProjectRole | ProjectRole[],
): boolean => {
  if (!project || !username) {
    return false;
  }
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.some((role) => {
    switch (role) {
      case "creator":
        return project.creator === username;
      case "editor":
        return Array.isArray(project.editors) && project.editors.includes(username);
      case "administrator":
        return Array.isArray(project.administrators) && project.administrators.includes(username);
      case "observer":
        return Array.isArray(project.observers) && project.observers.includes(username);
      default:
        return false;
    }
  });
};

/**
 * Hook to check if a user has any of the specified roles on a project by ID.
 * @param projectId Project ID
 * @param roles Single role or array of roles
 * @param username Optional username (defaults to current user)
 */
export const useHasProjectRole = (
  projectId: string | undefined,
  roles: ProjectRole | ProjectRole[],
  username?: string,
): boolean => {
  const { user } = useKeycloakUser();
  const project = useProjectFromId(projectId ?? "");
  const checkUser = username ?? user.username;
  return hasProjectRole(project, checkUser, roles);
};

/**
 * Hook to check if a user has any of the specified roles on the current project.
 * @param roles Single role or array of roles
 * @param username Optional username (defaults to current user)
 */
export const useHasProjectRoleOnCurrentProject = (
  roles: ProjectRole | ProjectRole[],
  username?: string,
): boolean => {
  const { user } = useKeycloakUser();
  const project = useCurrentProject();
  const checkUser = username ?? user.username;
  return hasProjectRole(project, checkUser, roles);
};
export const isProjectCreator = (
  project: ProjectDetail | null,
  username: string | undefined,
): boolean => {
  return !!project && !!username && project.creator === username;
};

export type ProjectId = string | undefined;
export type ProjectLocalStoragePayload = { projectId: ProjectId; version: number };

export const projectPayload = (projectId: ProjectId) => ({ version: 1, projectId });

// --- Pure role-checking utilities ---

export const isProjectEditor = (
  project: ProjectDetail | null,
  username: string | undefined,
): boolean => {
  return (
    !!project && !!username && Array.isArray(project.editors) && project.editors.includes(username)
  );
};

export const isProjectAdministrator = (
  project: ProjectDetail | null,
  username: string | undefined,
): boolean => {
  return (
    !!project &&
    !!username &&
    Array.isArray(project.administrators) &&
    project.administrators.includes(username)
  );
};

export const isProjectObserver = (
  project: ProjectDetail | null,
  username: string | undefined,
): boolean => {
  return (
    !!project &&
    !!username &&
    Array.isArray(project.observers) &&
    project.observers.includes(username)
  );
};

// --- Hooks for getting current project and project ID ---

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

  const setCurrentProjectId = (newProjectId?: string) => {
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

      void router.push(href, undefined);
    } else if (projectId !== undefined) {
      // The project has been cleared
      const newQuery = { ...query };
      delete newQuery.project;
      delete newQuery.path;

      const href = { pathname, query: newQuery };
      writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, projectPayload(undefined));
      void router.push(href, undefined, { scroll: false });
    }
  };

  return { projectId, setCurrentProjectId };
};

/**
 * @returns The project associated with the project-id in the current url query parameters
 */
export const useCurrentProject = (): ProjectDetail | null => {
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
export const useProjectFromId = (projectId: string): ProjectDetail | null => {
  const { data } = useGetProjects();
  const projects = data?.projects;
  return projects?.find((project) => project.project_id === projectId) ?? null;
};

// --- Internal shared hook for role checks ---
const useProjectRoleCheck = (
  getProject: () => ProjectDetail | null,
  roleCheck: (project: ProjectDetail | null, username: string | undefined) => boolean,
  username?: string,
): boolean => {
  const { user } = useKeycloakUser();
  const project = getProject();
  const checkUser = username ?? user.username;
  return roleCheck(project, checkUser);
};

// --- Hooks for role checks by project ID ---

/**
 * Check if a user (or current user) is admin or editor of the project with the given ID
 */
export const useIsAdminOrEditorOfProject = (projectId: string | undefined, username?: string) =>
  useProjectRoleCheck(
    () => useProjectFromId(projectId ?? ""),
    (project, user) => isProjectEditor(project, user) || isProjectAdministrator(project, user),
    username,
  );

/**
 * Check if a user (or current user) is admin or editor of the current project
 */
export const useIsUserAdminOrEditorOfCurrentProject = (username?: string) =>
  useProjectRoleCheck(
    useCurrentProject,
    (project, user) => isProjectEditor(project, user) || isProjectAdministrator(project, user),
    username,
  );

/**
 * Check if a user (or current user) is editor of the current project
 */
export const useIsEditorOfCurrentProject = (username?: string) =>
  useProjectRoleCheck(useCurrentProject, isProjectEditor, username);

/**
 * Check if a user (or current user) is creator of the project with the given ID
 */
export const useIsCreatorOfProject = (projectId: string | undefined, username?: string) =>
  useProjectRoleCheck(() => useProjectFromId(projectId ?? ""), isProjectCreator, username);

/**
 * Check if a user (or current user) is observer of the project with the given ID
 */
export const useIsObserverOfProject = (projectId: string | undefined, username?: string) =>
  useProjectRoleCheck(() => useProjectFromId(projectId ?? ""), isProjectObserver, username);

/**
 * Check if a user (or current user) is administrator of the project with the given ID
 */
export const useIsAdministratorOfProject = (projectId: string | undefined, username?: string) =>
  useProjectRoleCheck(() => useProjectFromId(projectId ?? ""), isProjectAdministrator, username);

/**
 * Check if a user (or current user) is creator of the current project
 */
export const useIsCreatorOfCurrentProject = (username?: string) =>
  useProjectRoleCheck(useCurrentProject, isProjectCreator, username);

/**
 * Check if a user (or current user) is observer of the current project
 */
export const useIsObserverOfCurrentProject = (username?: string) =>
  useProjectRoleCheck(useCurrentProject, isProjectObserver, username);

/**
 * Check if a user (or current user) is administrator of the current project
 */
export const useIsAdministratorOfCurrentProject = (username?: string) =>
  useProjectRoleCheck(useCurrentProject, isProjectAdministrator, username);
