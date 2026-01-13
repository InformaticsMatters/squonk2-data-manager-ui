import { useState } from "react";

import { useGetInstances } from "@squonk/data-manager-client/instance";
import { useGetTasks } from "@squonk/data-manager-client/task";
import { useGetRunningWorkflows } from "@squonk/data-manager-client/workflow";

import { Alert, Container, Grid } from "@mui/material";

import { CenterLoader } from "../components/CenterLoader";
import { useCurrentProjectId } from "../hooks/projectHooks";
import { getErrorMessage } from "../utils/next/orvalError";
import { ResultCards } from "./results/ResultCards";
import { ResultsToolbar } from "./results/ResultToolbar";

export type ResultType = "instance" | "task" | "workflow";

export const ResultsView = () => {
  const { projectId } = useCurrentProjectId();

  const { data: instances, error: instancesError } = useGetInstances(
    { project_id: projectId },
    { query: { select: (data) => data.instances } },
  );

  const { data: tasks, error: tasksError } = useGetTasks(
    { project_id: projectId, exclude_purpose: "INSTANCE.PROJECT" },
    { query: { select: (data) => data.tasks } },
  );

  const { data: workflows, error: workflowsError } = useGetRunningWorkflows(undefined, {
    query: { select: (data) => data.running_workflows },
  });

  const [resultTypes, setResultTypes] = useState<ResultType[]>(["workflow", "task", "instance"]);
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
          {!!instancesError && (
            <Alert severity="warning">
              Instances failed to load ({getErrorMessage(instancesError)})
            </Alert>
          )}
        </Grid>
        <Grid size={12}>
          {!!tasksError && (
            <Alert severity="warning">Tasks failed to load ({getErrorMessage(tasksError)})</Alert>
          )}
        </Grid>
        <Grid size={12}>
          {!!workflowsError && (
            <Alert severity="warning">
              Workflows failed to load ({getErrorMessage(workflowsError)})
            </Alert>
          )}
        </Grid>
        <Grid size={12}>
          {!!instances || !!tasks || !!workflows ? (
            <ResultCards
              instances={instances ?? []}
              resultTypes={resultTypes}
              searchValue={searchValue}
              tasks={tasks ?? []}
              workflows={workflows ?? []}
            />
          ) : (
            <CenterLoader />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
