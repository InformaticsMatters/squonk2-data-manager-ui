import type { InstanceGetResponse, InstanceSummary } from "@squonk/data-manager-client";
import { useGetJob } from "@squonk/data-manager-client/job";

import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import { Alert, Grid, ListItem, ListItemIcon, ListItemText } from "@mui/material";

import { usePolledGetInstance } from "../../../hooks/usePolledGetInstance";
import { getErrorMessage } from "../../../utils/next/orvalError";
import { CenterLoader } from "../../CenterLoader";
import { HorizontalList } from "../../HorizontalList";
import { PageSection } from "../../PageSection";
import { TaskDetails } from "../../tasks/TaskDetails";
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
  jobId: NonNullable<InstanceSummary["job_id"] | InstanceGetResponse["job_id"]>;
}

/**
 * Displays the details of an job based on the instance of a job
 */
export const JobDetails = ({ instanceId, jobId }: JobDetailsProps) => {
  const {
    data: instance,
    isLoading: isInstanceLoading,
    error: instanceError,
  } = usePolledGetInstance(instanceId);
  const { data: job, isLoading: isJobLoading, error: jobError } = useGetJob(jobId);

  if (isInstanceLoading || isJobLoading) {
    return <CenterLoader />;
  }

  if (instanceError) {
    return <Alert severity="error">{getErrorMessage(instanceError)}</Alert>;
  }
  if (jobError) {
    return <Alert severity="error">{getErrorMessage(jobError)}</Alert>;
  }

  return (
    <>
      <HorizontalList>
        <ListItem>
          <ListItemIcon sx={{ minWidth: "40px" }}>
            <AppsRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary={instance?.application_id}
            secondary={instance?.application_version}
          />
        </ListItem>
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
            {instance && <JobInputSection instance={instance} />}
          </PageSection>
        </Grid>

        <Grid item sm={6} xs={12}>
          <PageSection level={3} title="Outputs">
            {instance && <JobOutputSection instance={instance} />}
          </PageSection>
        </Grid>
      </Grid>

      {instance && <TaskDetails taskId={instance.tasks[instance.tasks.length - 1].id} />}
    </>
  );
};
