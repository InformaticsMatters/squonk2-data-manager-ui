import { useGetProjects } from '@squonk/data-manager-client/project';

import { useRouter } from 'next/router';

export type ProjectId = string | null;

/**
 * @returns The selected projectId from the project key of the query parameters
 */
export const useCurrentProjectId = () => {
  const { push, query, pathname } = useRouter();

  const projectId = query.project as ProjectId;
  const setCurrentProject = (newProjectId: ProjectId) => {
    if (newProjectId !== null) {
      push({
        pathname,
        query: { ...query, project: newProjectId },
      });
    } else {
      const newQuery = { ...query };
      delete newQuery.project;
      push({
        pathname: pathname,
        query: newQuery,
      });
    }
  };

  return [projectId, setCurrentProject] as const;
};

/**
 * @returns The project associated with the project-id in the current url query parameters
 */
export const useCurrentProject = () => {
  const [currentProjectId] = useCurrentProjectId();
  const { data } = useGetProjects();
  const projects = data?.projects;

  return projects?.find((project) => project.project_id === currentProjectId) ?? null;
};
