import testJob from "./test-job.json";

/**
 * The development-only job definition's identity, taken from the definition itself so the
 * catalogue that seeds it and the reads that back off for it cannot name different jobs.
 */
export const TEST_JOB_ID = testJob.summary.id;
