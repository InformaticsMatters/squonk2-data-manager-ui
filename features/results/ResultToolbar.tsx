import type { Dispatch, SetStateAction } from "react";

import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  useGetInstances,
} from "@squonk/data-manager-client/instance";
import { getGetProjectsQueryKey } from "@squonk/data-manager-client/project";

import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Grid, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { EventDebugSwitch } from "../../components/results/EventDebugSwitch";
import { SearchTextField } from "../../components/SearchTextField";
import { useCurrentProjectId } from "../../hooks/projectHooks";

export interface ResultsToolbarProps {
  /**
   * Value of the multiple select input
   */
  resultTypes: string[];
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
 * Filter results by task or instance and search by result contents
 */
export const ResultsToolbar = ({
  resultTypes,
  onSelectChange,
  searchValue,
  onSearchChange,
}: ResultsToolbarProps) => {
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
  const refreshResults = [
    () => queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() }),
    () =>
      queryClient.invalidateQueries({
        queryKey: getGetInstancesQueryKey({ project_id: projectId }),
      }),

    ...(instances ?? []).map(
      ({ id }) =>
        () =>
          queryClient.invalidateQueries({ queryKey: getGetInstanceQueryKey(id) }),
    ),
  ];

  return (
    <Grid container alignItems="center" spacing={2}>
      <Grid item md={4} sm={5} xs={12}>
        <TextField
          fullWidth
          select
          label="Filter Results"
          SelectProps={{
            multiple: true,
            onChange: (event) => {
              onSelectChange(event.target.value as string[]);
            },
          }}
          value={resultTypes}
        >
          <MenuItem value="task">Tasks</MenuItem>
          <MenuItem value="instance">Instances</MenuItem>
        </TextField>
      </Grid>

      {/* Event Debug Toggle */}
      <Grid item md={1} sm={2}>
        <EventDebugSwitch />
      </Grid>

      <Grid item md={4} sm={5} sx={{ ml: "auto" }} xs={12}>
        <SearchTextField
          fullWidth
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </Grid>

      <Grid item sm="auto" sx={{ textAlign: "center" }} xs={12}>
        <Tooltip title="Refresh Tasks">
          <IconButton
            size="large"
            sx={{ ml: "auto" }}
            onClick={() => refreshResults.forEach((func) => func())}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
