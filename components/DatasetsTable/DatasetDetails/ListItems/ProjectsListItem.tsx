import { useMemo } from 'react';

import type { Error as DMError, ProjectsGetResponse } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { Box, CircularProgress, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import type { AxiosError } from 'axios';

export interface ProjectsListItemProps {
  /**
   * IDs of projects to display their names.
   */
  projectIds?: string[];
}

/**
 * Displays a list of project names according to provided project IDs. In case a requesting user
 * doesn't have enough permissions to see the project names, the list displays a number of hidden
 * project at its end.
 */
export const ProjectsListItem = ({ projectIds }: ProjectsListItemProps) => {
  const { data, isLoading, isError, error } = useGetProjects<
    ProjectsGetResponse,
    AxiosError<DMError>
  >({
    query: { enabled: Boolean(projectIds) },
  });

  const projectNames = useMemo(() => {
    if (projectIds && data) {
      const { projects } = data;
      // Key is used for rendering the list
      const names: { key: string; name: string }[] = [];

      projects.forEach((project) => {
        const { name, project_id } = project;
        if (projectIds.includes(project_id)) {
          names.push({ key: project_id, name });
        }
      });

      // If the size of the project names differ, it means the requesting user doesn't have enough
      // permissions to see them. Display the difference as hidden projects.
      const sizeDifference = projectIds.length - names.length;
      if (sizeDifference) {
        // In case all of the projects are hidden from the user, displays only the number instead
        // of `and 5 hidden`
        const prefix = names.length ? 'and ' : '';
        names.push({ key: '', name: `${prefix}${sizeDifference} hidden` });
      }

      return names;
    }
    return [];
  }, [projectIds, data]);

  const projectsContent = (() => {
    if (isLoading) {
      return <CircularProgress size={20} />;
    }

    if (isError) {
      return (
        <Typography
          align="right"
          color="error"
          css={css`
            flex-grow: 1;
          `}
        >
          {error?.response?.data.error}
        </Typography>
      );
    }

    return (
      <List
        disablePadding
        css={css`
          flex-grow: 1;
          & > * {
            padding: 0;
          }
        `}
      >
        {projectNames.map((projectName) => {
          return (
            <ListItem key={projectName.key}>
              <ListItemText
                primary={projectName.name}
                primaryTypographyProps={{ align: 'right' }}
              />
            </ListItem>
          );
        })}
      </List>
    );
  })();

  return (
    <ListItem
      css={css`
        align-items: flex-start;
      `}
    >
      <ListItemText primary="Used in projects" />
      <Box display="flex" flex="1 1 auto" justifyContent="center">
        {projectsContent}
      </Box>
    </ListItem>
  );
};
