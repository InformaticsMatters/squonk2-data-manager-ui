import type { InstanceSummary } from "@squonk/data-manager-client";
import { useGetInstance } from "@squonk/data-manager-client/instance";

import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import { Grid, ListItem, ListItemIcon, ListItemText } from "@mui/material";

import { CenterLoader } from "../../../CenterLoader";
import { PageSection } from "../../../PageSection";
import { HorizontalList } from "../../common/HorizontalList";
import { TaskDetails } from "../../TaskDetails";
import { JobInputSection } from "./JobInputSection";
import { JobOutputSection } from "./JobOutputSection";
import type { CommonDetailsProps } from "./types";

export interface JobDetailsProps extends CommonDetailsProps {
  /**
   * Instance of the job
   */
  instanceSummary: InstanceSummary;
}

/**
 * Displays the details of an job based on the instance of a job
 */
export const JobDetails = ({ instanceSummary, poll = false }: JobDetailsProps) => {
  const { data: instance } = useGetInstance(instanceSummary.id, {
    query: { refetchInterval: poll ? 5000 : undefined },
  });

  if (instance === undefined) {
    return <CenterLoader />;
  }

  return (
    <>
      <HorizontalList>
        <ListItem>
          <ListItemIcon sx={{ minWidth: "40px" }}>
            <AppsRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary={instance.application_id}
            secondary={instance.application_version}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon sx={{ minWidth: "40px" }}>
            <WorkOutlineRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary={instanceSummary.job_collection}
            secondary={instanceSummary.job_version}
          />
        </ListItem>
      </HorizontalList>

      <Grid container>
        <Grid item sm={6} xs={12}>
          <PageSection level={3} title="Inputs">
            <JobInputSection instanceSummary={instanceSummary} />
          </PageSection>
        </Grid>

        <Grid item sm={6} xs={12}>
          <PageSection level={3} title="Outputs">
            <JobOutputSection instanceSummary={instanceSummary} />
          </PageSection>
        </Grid>
      </Grid>

      <TaskDetails
        eventsVariant={instanceSummary.job_image_type}
        taskId={instance.tasks[instance.tasks.length - 1].id}
      />
    </>
  );
};
