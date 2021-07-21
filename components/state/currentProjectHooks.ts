import { useGetProjects } from '@squonk/data-manager-client/project';

import { useRouter } from 'next/router';

export type ProjectId = string | undefined;

/**
 * @returns The selected projectId from the project key of the query parameters
 */
export const useCurrentProjectId = () => {
  const router = useRouter();

  const projectId = router.query.project as ProjectId;

  const setCurrentProjectId = (newProjectId?: string, shallow?: true) => {
    if (newProjectId !== undefined) {
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
