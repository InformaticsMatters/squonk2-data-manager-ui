import { type InstanceGetResponse } from "@/api/data-manager";
import { useGetJob } from "@/api/data-manager/job";

import { WorkOutlineRounded as WorkOutlineRoundedIcon } from "@mui/icons-material";
import { Grid, ListItem, ListItemIcon, ListItemText } from "@mui/material";

import { HorizontalList } from "../../HorizontalList";
import { PageSection } from "../../PageSection";
import { TaskDetails } from "../../tasks/TaskDetails";
import { CommonDetails } from "./CommonDetails";
import { ExitCodeFromTask } from "./ExitCodeFromTask";
import { JobInputSection } from "./JobInputSection";
import { JobOutputSection } from "./JobOutputSection";

export interface JobDetailsProps {
  /** The addressed instance's own read; nothing here is fetched a second time. */
  instance: InstanceGetResponse;
  /**
   * The job definition the instance ran, where this client can address it. A job instance whose
   * definition it cannot address still accounts for everything the instance itself carries.
   */
  jobId?: number;
}

/**
 * The definition one job instance ran. It is only asked for where the instance named a definition
 * this client can address, so no read is ever issued for an identity this client invented.
 */
const JobDefinition = ({ jobId }: { jobId: number }) => {
  const { data: job } = useGetJob(jobId);

  return job ? (
    <ListItem>
      <ListItemIcon sx={{ minWidth: "40px" }}>
        <WorkOutlineRoundedIcon />
      </ListItemIcon>
      <ListItemText primary={job.collection} secondary={job.version} />
    </ListItem>
  ) : null;
};

/**
 * What one job instance ran, was given, and produced. Every path it names is a file of the project
 * the instance itself declares, so locating an input or an output can never address another
 * project's files.
 */
export const JobDetails = ({ instance, jobId }: JobDetailsProps) => {
  const lastTask = instance.tasks.at(-1);

  return (
    <>
      <HorizontalList>
        <CommonDetails instance={instance} />
        {jobId === undefined ? null : <JobDefinition jobId={jobId} />}
        {!!lastTask && <ExitCodeFromTask taskId={lastTask.id} />}
      </HorizontalList>

      <Grid container>
        <Grid size={{ sm: 6, xs: 12 }}>
          <PageSection level={3} title="Inputs">
            <JobInputSection instance={instance} />
          </PageSection>
        </Grid>

        <Grid size={{ sm: 6, xs: 12 }}>
          <PageSection level={3} title="Outputs">
            <JobOutputSection instance={instance} />
          </PageSection>
        </Grid>
      </Grid>

      {!!lastTask && <TaskDetails taskId={lastTask.id} />}
    </>
  );
};
