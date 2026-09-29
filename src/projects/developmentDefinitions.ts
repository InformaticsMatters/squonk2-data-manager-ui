import { type JobSummary } from "@/api/data-manager";
import { getGetJobQueryKey } from "@/api/data-manager/job";

import { type QueryClient } from "@tanstack/react-query";

import { TEST_JOB_ID } from "../components/runCards/TestJob/jobId";
import testJob from "../components/runCards/TestJob/test-job.json";

const inDevelopment = process.env.NODE_ENV === "development";

/**
 * A job definition that exists only while developing, so the job form can be exercised without a
 * Data Manager that publishes one. It is empty in every other environment, and it is added to the
 * catalogue rather than to any read, so nothing about a deployed Run catalogue depends on it.
 */
export const developmentJobs: JobSummary[] = inDevelopment
  ? // The JSON loader widens the string literals the generated summary type requires.
    [testJob.summary as JobSummary]
  : [];

/**
 * Seeds the generated job detail those development definitions describe, under the generated key
 * factory, so the definition route resolves them exactly as it resolves a published job.
 */
export const seedDevelopmentDefinitions = (queryClient: QueryClient) => {
  if (!inDevelopment) {
    return;
  }
  queryClient.setQueryData(getGetJobQueryKey(TEST_JOB_ID), testJob.detail);
};
