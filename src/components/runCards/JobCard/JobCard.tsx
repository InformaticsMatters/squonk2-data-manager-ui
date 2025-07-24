import { useState } from "react";

import { type JobSummary } from "@squonk/data-manager-client";

import { Launch as LaunchIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import semver from "semver";

import { BaseCard } from "../../BaseCard";
import { Chips } from "../../Chips";
import { type InstancesListProps } from "../InstancesList";
import { RunJobButton, type RunJobButtonProps } from "./RunJobButton";

const compareJobs = (a: JobSummary, b: JobSummary) => {
  return -semver.compare(a.version, b.version);
};

const InstancesList = dynamic<InstancesListProps>(
  () => import("../InstancesList").then((mod) => mod.InstancesList),
  { loading: () => <LinearProgress /> },
);

export interface ApplicationCardProps extends Pick<RunJobButtonProps, "projectId"> {
  /**
   * the list of jobs (different versions) to be instantiated
   */
  job: JobSummary[];
  /**
   * Whether to disable the button
   */
  disabled?: boolean;
}

/**
 * MuiCard that displays a summary of a job with actions to create new instances and view
 * existing instances.
 */
export const JobCard = ({ projectId, job: jobs, disabled = false }: ApplicationCardProps) => {
  jobs.sort(compareJobs);
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || "");
  const job = jobs.find((j) => j.id === selectedJobId) as JobSummary;

  return (
    <BaseCard
      actions={({ setExpanded }) => (
        <>
          <TextField
            select
            disabled={jobs.length === 1}
            label="Version"
            size="small"
            sx={{ minWidth: 120 }}
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobs.map((jobVersion) => (
              <MenuItem key={jobVersion.id} value={jobVersion.id}>
                {jobVersion.version}
              </MenuItem>
            ))}
          </TextField>
          <RunJobButton
            disabled={job.disabled || disabled}
            jobId={job.id}
            projectId={projectId}
            onLaunch={() => setExpanded(true)}
          />
        </>
      )}
      collapsed={
        <InstancesList
          predicate={(instance) =>
            instance.job_collection === job.collection && instance.job_job === job.job
          }
        />
      }
      header={{ color: "primary.main", subtitle: job.name, avatar: job.job[0], title: job.job }}
      key={projectId} // Reset state when project changes
    >
      <Typography
        color="text.secondary"
        sx={{ textTransform: "uppercase", fontWeight: "bold" }}
        variant="caption"
      >
        Job
      </Typography>

      {!!job.description && (
        <Typography sx={{ mt: 1, mb: 2, textWrap: "pretty" }} variant="body1">
          {job.description}
          {!!job.doc_url && (
            <Tooltip title="View documentation">
              <IconButton
                href={job.doc_url}
                rel="noopener noreferrer"
                size="small"
                sx={{ ml: 0.5, p: 0.25, verticalAlign: "middle" }}
                target="_blank"
              >
                <LaunchIcon sx={{ fontSize: "0.875rem" }} />
              </IconButton>
            </Tooltip>
          )}
        </Typography>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom color="text.secondary" variant="body2">
          Category & Collection:
        </Typography>
        <Typography variant="body1">
          <em>{job.category ?? "No category"}</em> • {job.collection}
        </Typography>
      </Box>

      {!!job.keywords && job.keywords.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom color="text.secondary" variant="body2">
            Keywords:
          </Typography>
          <Chips>
            {job.keywords.map((word) => (
              <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
            ))}
          </Chips>
        </Box>
      )}

      {!!job.disabled_reason && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {job.disabled_reason}
        </Alert>
      )}
    </BaseCard>
  );
};
