import { useState } from "react";

import { useGetInstances } from "@squonk/data-manager-client/instance";
import { useGetTasks } from "@squonk/data-manager-client/task";

import { Alert, Container, Grid2 as Grid } from "@mui/material";

import { CenterLoader } from "../components/CenterLoader";
import { useCurrentProjectId } from "../hooks/projectHooks";
import { getErrorMessage } from "../utils/next/orvalError";
import { ResultCards } from "./results/ResultCards";
import { ResultsToolbar } from "./results/ResultToolbar";

export const ResultsView = () => {
  const { projectId } = useCurrentProjectId();

  const {
    data: instancesData,
    isLoading: isInstancesLoading,
    isError: isInstancesError,
    error: instancesError,
  } = useGetInstances({ project_id: projectId });
  const instances = instancesData?.instances;

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
  } = useGetTasks({ project_id: projectId, exclude_purpose: "INSTANCE.PROJECT" });
  const tasks = tasksData?.tasks;

  const [resultTypes, setResultTypes] = useState(["task", "instance"]);
  const [searchValue, setSearchValue] = useState("");
  return (
    <Container maxWidth="md">
      <ResultsToolbar
        resultTypes={resultTypes}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSelectChange={setResultTypes}
      />

      <Grid container spacing={1}>
        <Grid size={12}>
          {!!isInstancesError && (
            <Alert severity="warning">
              Instances failed to load ({getErrorMessage(instancesError)})
            </Alert>
          )}
        </Grid>
        <Grid size={12}>
          {!!isTasksError && (
            <Alert severity="warning">Tasks failed to load ({getErrorMessage(tasksError)})</Alert>
          )}
        </Grid>
        <Grid size={12}>
          {!!(instances && !isInstancesLoading) || (tasks && !isTasksLoading) ? (
            <ResultCards
              instances={instances ?? []}
              resultTypes={resultTypes}
              searchValue={searchValue}
              tasks={tasks ?? []}
            />
          ) : (
            <CenterLoader />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
