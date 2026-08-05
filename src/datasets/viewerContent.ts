import { type ServerResponse } from "node:http";

import { type NotSuccessful, type Successful } from "../utils/api/plaintextViewerSSR";
import { createErrorProps } from "../utils/api/serverSidePropsError";

/**
 * Server-rendered content facts for one dataset version, exactly as the viewer transport returned
 * them.
 */
export type DatasetVersionContent = NotSuccessful | Successful;

export type DatasetVersionContentOutcome =
  | { kind: "content"; content: Successful }
  | { kind: "failed"; statusCode: number; statusMessage: string }
  | { kind: "missing" }
  | { kind: "recoverable" };

export const DATASET_VERSION_NOT_FOUND = "Dataset version not found";

/**
 * Decides what the viewer shows for the version named by the URL. Absence and denial read
 * identically so the viewer discloses nothing, and any answer that cannot establish absence stays
 * retryable against the same version.
 */
export const classifyDatasetVersionContent = (
  content: DatasetVersionContent,
): DatasetVersionContentOutcome => {
  if ("content" in content) {
    return { kind: "content", content };
  }
  const { statusCode, statusMessage } = content;
  if (!Number.isInteger(statusCode) || statusCode < 100) {
    return { kind: "recoverable" };
  }
  if (statusCode === 403 || statusCode === 404) {
    return { kind: "missing" };
  }
  if (statusCode === 401 || statusCode === 429 || statusCode >= 500) {
    return { kind: "recoverable" };
  }
  return { kind: "failed", statusCode, statusMessage };
};

/**
 * Answers a denied version exactly as a missing one, in the response as well as the page, so the
 * viewer transport cannot be used to discover which dataset versions exist.
 */
export const concealDatasetVersionAbsence = (
  res: ServerResponse,
  result: { props: DatasetVersionContent },
): { props: DatasetVersionContent } =>
  classifyDatasetVersionContent(result.props).kind === "missing"
    ? createErrorProps(res, 404, DATASET_VERSION_NOT_FOUND)
    : result;
