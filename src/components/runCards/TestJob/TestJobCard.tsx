import { type JobSummary } from "@squonk/data-manager-client";
import { getGetJobQueryKey } from "@squonk/data-manager-client/job";

import { Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCurrentProject,
  useIsUserAdminOrEditorOfCurrentProject,
} from "../../../hooks/projectHooks";
import { JobCard } from "../JobCard";
import { TEST_JOB_ID } from "./jobId";
import testJob from "./test-job.json";

export const TestJobCard = () => {
  const currentProject = useCurrentProject();
  const hasPermission = useIsUserAdminOrEditorOfCurrentProject();

  const job = testJob.summary;

  const queryClient = useQueryClient();

  queryClient.setQueryData(getGetJobQueryKey(TEST_JOB_ID), testJob.detail);

  return (
    <Box key={job.id}>
      <JobCard
        disabled={!hasPermission}
        job={[job] as JobSummary[]} // assertion needed as JSON loader doesn't use string literal types
        projectId={currentProject?.project_id}
      />
    </Box>
  );
};
