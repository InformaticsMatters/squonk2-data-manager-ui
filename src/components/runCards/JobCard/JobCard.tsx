import { useState } from "react";

import { type InstanceSummary, type JobSummary } from "@/api/data-manager";

import { Launch as LaunchIcon } from "@mui/icons-material";
import { Box, Chip, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";

import { type RunState } from "../../../projects/routes";
import { type RunExecutions } from "../../../projects/runFacts";
import { BaseCard } from "../../BaseCard";
import { Chips } from "../../Chips";
import { ExecutionCountBadge } from "../ExecutionCountBadge";
import { InstancesList } from "../InstancesList";
import { RunDefinitionButton } from "../RunDefinitionButton";

export interface JobCardProps {
  /** This project's instances, as the badge counting the selected version's executions sees them. */
  executions: RunExecutions;
  /** The read listing this project's instances has not answered yet. */
  executionsLoading?: boolean;
  /** This job's existing instances inside the project that owns them. */
  instances: readonly InstanceSummary[];
  /**
   * Every version of one job, newest first. Each version has its own canonical definition route.
   */
  jobs: JobSummary[];
  projectId: string;
  runState: RunState;
}

/**
 * MuiCard that displays a summary of a job, linking to the canonical definition route of the
 * version selected on the card and listing the instances the addressed project already has of it.
 *
 * What running this version requires is not stated here: the section states once what the project
 * requires of every definition, and the modal the card's Run link opens states what the version it
 * addresses requires of its own accord.
 */
export const JobCard = ({
  executions,
  executionsLoading,
  instances,
  jobs,
  projectId,
  runState,
}: JobCardProps) => {
  // Which version the card offers is ephemeral card state: the definition route it links to is
  // what makes a chosen version shareable.
  const [selectedJobId, setSelectedJobId] = useState(String(jobs[0].id));
  const job = jobs.find((candidate) => String(candidate.id) === selectedJobId) ?? jobs[0];

  return (
    <BaseCard
      accentColor="primary.main"
      actions={
        <>
          {/* The badge counts and links to the version selected below it, so changing that select
          moves both together and the count can never disagree with the list it opens. */}
          <ExecutionCountBadge
            executions={executions}
            projectId={projectId}
            selection={{ kind: "job", job }}
          />
          <TextField
            select
            disabled={jobs.length === 1}
            label="Version"
            size="small"
            sx={{ minWidth: 120 }}
            value={String(job.id)}
            onChange={(event) => setSelectedJobId(event.target.value)}
          >
            {jobs.map((jobVersion) => (
              <MenuItem key={jobVersion.id} value={String(jobVersion.id)}>
                {jobVersion.version}
              </MenuItem>
            ))}
          </TextField>
          <RunDefinitionButton
            definitionId={String(job.id)}
            definitionLabel={job.job}
            definitionType="jobs"
            projectId={projectId}
            runState={runState}
          />
        </>
      }
      collapsed={<InstancesList instances={instances} isLoading={executionsLoading} />}
      header={{ subtitle: job.name, avatar: job.job[0], title: job.job }}
    >
      <Typography
        sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}
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
        <Typography gutterBottom sx={{ color: "text.secondary" }} variant="body2">
          Category & Collection:
        </Typography>
        <Typography variant="body1">
          <em>{job.category ?? "No category"}</em> • {job.collection}
        </Typography>
      </Box>
      {!!job.keywords && job.keywords.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom sx={{ color: "text.secondary" }} variant="body2">
            Keywords:
          </Typography>
          <Chips>
            {job.keywords.map((word) => (
              <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
            ))}
          </Chips>
        </Box>
      )}
    </BaseCard>
  );
};
