import { type JobSummary } from "@squonk/data-manager-client";

import { Alert, Chip, CircularProgress, Link, Typography } from "@mui/material";
import dynamic from "next/dynamic";

import { BaseCard } from "../../BaseCard";
import { Chips } from "../../Chips";
import { type InstancesListProps } from "../InstancesList";
import { RunJobButton, type RunJobButtonProps } from "./RunJobButton";

const InstancesList = dynamic<InstancesListProps>(
  () => import("../InstancesList").then((mod) => mod.InstancesList),
  { loading: () => <CircularProgress size="1rem" /> },
);

export interface ApplicationCardProps extends Pick<RunJobButtonProps, "projectId"> {
  /**
   * the job to be instantiated
   */
  job: JobSummary;
  /**
   * Whether to disable the button
   */
  disabled?: boolean;
}

/**
 * MuiCard that displays a summary of a job with actions to create new instances and view
 * existing instances.
 */
export const JobCard = ({ projectId, job, disabled = false }: ApplicationCardProps) => {
  return (
    <BaseCard
      actions={({ setExpanded }) => (
        <RunJobButton
          disabled={job.disabled || disabled}
          jobId={job.id}
          projectId={projectId}
          onLaunch={() => setExpanded(true)}
        />
      )}
      collapsed={
        <InstancesList
          predicate={(instance) => instance.job_id === job.id && instance.job_job === job.job}
        />
      }
      header={{
        color: "primary.main",
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
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
        <em>{job.category || "<none>"}</em> : {job.collection}
      </Typography>
      <Chips>
        {job.keywords?.map((word) => (
          <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
        ))}
      </Chips>

      {!!job.disabled_reason && (
        <Alert severity="warning" sx={{ mt: 1, mb: -2 }}>
          {job.disabled_reason}
        </Alert>
      )}
    </BaseCard>
  );
};
