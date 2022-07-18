import type { Dispatch, SetStateAction } from "react";
import { useQueryClient } from "react-query";

import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  useGetInstances,
} from "@squonk/data-manager-client/instance";
import { getGetProjectsQueryKey } from "@squonk/data-manager-client/project";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useEventDebugMode } from "../../state/eventDebugMode";
import { SearchTextField } from "../SearchTextField";

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

  const [debug, setDebug] = useEventDebugMode();

  const { data } = useGetInstances({
    project_id: projectId,
  });
  const instances = data?.instances;

  /**
   * Array of functions to call when the "refresh button" is pressed
   * These should be executed in parallel
   */
  const refreshResults = [
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
        <FormControlLabel
          control={<Switch checked={debug} onChange={(_event, checked) => setDebug(checked)} />}
          label="Event debug"
          labelPlacement="start"
        />
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
