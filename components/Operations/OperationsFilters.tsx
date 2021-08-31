import type { Dispatch, FC, SetStateAction } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  useGetInstances,
} from '@squonk/data-manager-client/instance';
import { getGetProjectsQueryKey } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import {
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  useTheme,
} from '@material-ui/core';
import RefreshRoundedIcon from '@material-ui/icons/RefreshRounded';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';

import { useCurrentProjectId } from '../state/currentProjectHooks';

export interface OperationsFiltersProps {
  operationTypes: string[];
  setOperationTypes: Dispatch<SetStateAction<string[]>>;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
}

export const OperationsFilters: FC<OperationsFiltersProps> = ({
  operationTypes,
  setOperationTypes,
  searchValue,
  setSearchValue,
}) => {
  const theme = useTheme();

  const { projectId } = useCurrentProjectId();

  const queryClient = useQueryClient();

  const { data: instancesData } = useGetInstances({
    project_id: projectId,
  });
  const instances = instancesData?.instances;

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
    <Grid
      container
      alignItems="center"
      css={css`
        margin-bottom: ${theme.spacing(2)}px;
      `}
      spacing={2}
    >
      <Grid item md={4} sm={5} xs={12}>
        <TextField
          fullWidth
          select
          label="Filter Tasks"
          SelectProps={{
            multiple: true,
            onChange: (event) => {
              setOperationTypes(event.target.value as string[]);
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
        <TextField
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchRoundedIcon />
              </InputAdornment>
            ),
          }}
          label="Search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
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
