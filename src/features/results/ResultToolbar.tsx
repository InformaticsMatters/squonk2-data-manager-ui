import { type Dispatch, type SetStateAction } from "react";

import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  useGetInstances,
} from "@squonk/data-manager-client/instance";
import { getGetProjectsQueryKey } from "@squonk/data-manager-client/project";

import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Grid2 as Grid, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { EventDebugSwitch } from "../../components/results/EventDebugSwitch";
import { SearchTextField } from "../../components/SearchTextField";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { type ResultType } from "../ResultsView";

export interface ResultsToolbarProps {
  /**
   * Value of the multiple select input
   */
  resultTypes: ResultType[];
  /**
   * Called when a change is made to the select input
   */
  onSelectChange: Dispatch<SetStateAction<ResultType[]>>;
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

  const { data } = useGetInstances({ project_id: projectId });
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
    <Grid container spacing={2} sx={{ alignItems: "center" }}>
      <Grid size={{ md: 4, sm: 4, xs: 12 }}>
        <TextField
          fullWidth
          select
          label="Filter Results"
          slotProps={{
            select: {
              multiple: true,
              onChange: (event) => {
                onSelectChange(event.target.value as ResultType[]);
              },
            },
          }}
          value={resultTypes}
        >
          <MenuItem value="workflow">Workflows</MenuItem>
          <MenuItem value="task">Tasks</MenuItem>
          <MenuItem value="instance">Instances</MenuItem>
        </TextField>
      </Grid>
      {/* Event Debug Toggle */}
      <Grid size={{ md: 1, sm: 2 }}>
        <EventDebugSwitch />
      </Grid>
      <Grid size={{ md: 4, sm: 5, xs: 12 }} sx={{ ml: "auto" }}>
        <SearchTextField
          fullWidth
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: "auto" }} sx={{ textAlign: "center" }}>
        <Tooltip title="Refresh Tasks">
          <IconButton
            size="large"
            sx={{ ml: "auto" }}
            onClick={() => refreshResults.forEach((func) => void func())}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
