import type { Dispatch, SetStateAction } from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  useGetInstances,
} from '@squonk/data-manager-client/instance';
import { getGetProjectsQueryKey } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { Grid, IconButton, MenuItem, TextField, Tooltip } from '@material-ui/core';
import RefreshRoundedIcon from '@material-ui/icons/RefreshRounded';

import { useCurrentProjectId } from '../../hooks/currentProjectHooks';
import { SearchTextField } from '../SearchTextField';

export interface OperationsToolbarProps {
  /**
   * Value of the multiple select input
   */
  operationTypes: string[];
  /**
   * Called when a change is made to the select input
   */
  onSelectChange: Dispatch<SetStateAction<string[]>>;
  /**
   * Value of the search input
   */
  searchValue: string;
  /**
   * Called when a change is made to the search input
   */
  onSearchChange: Dispatch<SetStateAction<string>>;
}

/**
 * Filter operations by task or instance and search by operation contents
 */
export const OperationsToolbar = ({
  operationTypes,
  onSelectChange,
  searchValue,
  onSearchChange,
}: OperationsToolbarProps) => {
  const { projectId } = useCurrentProjectId();

  const queryClient = useQueryClient();

  const { data } = useGetInstances({
    project_id: projectId,
  });
  const instances = data?.instances;

  /**
   * Array of functions to call when the "refresh button" is pressed
   * These should be executed in parallel
   */
  const refreshOperations = [
    () => queryClient.invalidateQueries(getGetProjectsQueryKey()),
    () => queryClient.invalidateQueries(getGetInstancesQueryKey({ project_id: projectId })),

    ...(instances ?? []).map(
      ({ id }) =>
        () =>
          queryClient.invalidateQueries(getGetInstanceQueryKey(id)),
    ),
  ];

  return (
    <Grid container alignItems="center" spacing={2}>
      <Grid item md={4} sm={5} xs={12}>
        <TextField
          fullWidth
          select
          label="Filter Tasks"
          SelectProps={{
            multiple: true,
            onChange: (event) => {
              onSelectChange(event.target.value as string[]);
            },
          }}
          value={operationTypes}
        >
          <MenuItem value="task">Tasks</MenuItem>
          <MenuItem value="instance">Instances</MenuItem>
        </TextField>
      </Grid>

      <Grid
        item
        css={css`
          margin-left: auto;
        `}
        md={4}
        sm={5}
        xs={12}
      >
        <SearchTextField
          fullWidth
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </Grid>

      <Grid
        item
        css={css`
          text-align: center;
        `}
        sm="auto"
        xs={12}
      >
        <Tooltip title="Refresh Tasks">
          <IconButton
            css={css`
              margin-left: auto;
            `}
            onClick={() => refreshOperations.forEach((func) => func())}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
