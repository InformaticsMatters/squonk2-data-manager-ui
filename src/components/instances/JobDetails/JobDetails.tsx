import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";
import { useGetJob } from "@squonk/data-manager-client/job";

import { WorkOutlineRounded as WorkOutlineRoundedIcon } from "@mui/icons-material";
import { Alert, Grid, ListItem, ListItemIcon, ListItemText } from "@mui/material";

import { usePolledGetInstance } from "../../../hooks/usePolledGetInstance";
import { getErrorMessage } from "../../../utils/next/orvalError";
import { CenterLoader } from "../../CenterLoader";
import { HorizontalList } from "../../HorizontalList";
import { PageSection } from "../../PageSection";
import { TaskDetails } from "../../tasks/TaskDetails";
import { CommonDetails } from "./CommonDetails";
import { JobInputSection } from "./JobInputSection";
import { JobOutputSection } from "./JobOutputSection";

export interface JobDetailsProps {
  /**
   * Instance of the job
   */
  instanceId: string;
  /**
   * ID of the Job
   */
  jobId: NonNullable<InstanceGetResponse["job_id"] | InstanceSummary["job_id"]>;
}

/**
 * Displays the details of an job based on the instance of a job
 */
export const JobDetails = ({ instanceId, jobId }: JobDetailsProps) => {
  const { data: instance, error: instanceError } = usePolledGetInstance(instanceId);
  const { data: job, error: jobError } = useGetJob(jobId);

  if (!instance) {
    return <CenterLoader />;
  }

  if (instanceError) {
    return <Alert severity="error">{getErrorMessage(instanceError)}</Alert>;
  }
  if (jobError) {
    return <Alert severity="error">{getErrorMessage(jobError)}</Alert>;
  }

  const lastTask = instance.tasks.at(-1);
  return (
    <>
      <HorizontalList>
        <CommonDetails instance={instance} />
        <ListItem>
          <ListItemIcon sx={{ minWidth: "40px" }}>
            <WorkOutlineRoundedIcon />
          </ListItemIcon>
          <ListItemText primary={job?.collection} secondary={job?.version} />
        </ListItem>
      </HorizontalList>

      <Grid container>
        <Grid item sm={6} xs={12}>
          <PageSection level={3} title="Inputs">
            <JobInputSection instance={instance} />
          </PageSection>
        </Grid>

        <Grid item sm={6} xs={12}>
          <PageSection level={3} title="Outputs">
            <JobOutputSection instance={instance} />
          </PageSection>
        </Grid>
      </Grid>

      {!!lastTask && <TaskDetails taskId={lastTask.id} />}
    </>
  );
};
