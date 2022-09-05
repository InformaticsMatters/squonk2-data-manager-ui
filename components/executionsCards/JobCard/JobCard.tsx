import type { JobSummary } from "@squonk/data-manager-client";

import { Chip, CircularProgress, Link, Typography, useTheme } from "@mui/material";
import dynamic from "next/dynamic";

import type { BaseCardProps } from "../../BaseCard";
import { Chips } from "../../Chips";
import type { InstancesListProps } from "../InstancesList";
import type { RunJobButtonProps } from "./RunJobButton";

const RunJobButton = dynamic<RunJobButtonProps>(
  () => import("./RunJobButton").then((mod) => mod.RunJobButton),
  { loading: () => <CircularProgress size="1rem" /> },
);

const InstancesList = dynamic<InstancesListProps>(
  () => import("../InstancesList").then((mod) => mod.InstancesList),
  { loading: () => <CircularProgress size="1rem" /> },
);

const BaseCard = dynamic<BaseCardProps>(
  () => import("../../BaseCard").then((mod) => mod.BaseCard),
  { loading: () => <CircularProgress size="1rem" /> },
);

export interface ApplicationCardProps extends Pick<RunJobButtonProps, "projectId"> {
  /**
   * the job to be instantiated
   */
  job: JobSummary;
}

/**
 * MuiCard that displays a summary of a job with actions to create new instances and view
 * existing instances.
 */
export const JobCard = ({ projectId, job }: ApplicationCardProps) => {
  const theme = useTheme();
  return (
    <BaseCard
      actions={({ setExpanded }) => (
        <RunJobButton jobId={job.id} projectId={projectId} onLaunch={() => setExpanded(true)} />
      )}
      collapsed={
        <InstancesList
          predicate={(instance) => instance.job_id === job.id && instance.job_job === job.job}
        />
      }
      header={{
        color: theme.palette.primary.main,
        subtitle: job.name,
        avatar: job.job[0],
        title: job.job,
      }}
      key={projectId} // Reset state when project changes
    >
      <Typography gutterBottom>{job.description}</Typography>
      <Typography variant="body2">
        {job.version} –{" "}
        <Link href={job.doc_url} rel="noopener noreferrer" target="_blank">
          docs
        </Link>
      </Typography>
      <Typography gutterBottom>
        <em>{job.category || "<none>"}</em> : {job.collection}
      </Typography>
      <Chips>
        {job.keywords?.map((word) => (
          <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
        ))}
      </Chips>
    </BaseCard>
  );
};
