import { type ServerResponse } from "node:http";

import { createErrorProps } from "../utils/api/serverSidePropsError";
import { classifyViewerContent, type ViewerContent } from "../utils/api/viewerContent";

/**
 * Server-rendered content facts for one dataset version, exactly as the viewer transport returned
 * them.
 */
export type DatasetVersionContent = ViewerContent;

export const DATASET_VERSION_NOT_FOUND = "Dataset version not found";

/**
 * Decides what the viewer shows for the version named by the URL, on the terms every viewer
 * transport is read on.
 */
export const classifyDatasetVersionContent = classifyViewerContent;

/**
 * Answers a version that will not be delivered as the Data Manager answered it: its own status and
 * its own reason, in the response as well as the page, so a version that is not there and one this
 * caller may not read are told apart.
 *
 * A denied version used to be answered exactly as a missing one, so the viewer transport could not
 * be used to discover which versions exist. That reversal, and why, is recorded where the rule
 * itself lives, in `classifyViewerContent`. The viewer's own notice stands in where the Data
 * Manager accounted for nothing, and upstream words reach the status line only through
 * `createErrorProps`.
 */
export const reportDatasetVersionFailure = (
  res: ServerResponse,
  result: { props: DatasetVersionContent },
): { props: DatasetVersionContent } => {
  const outcome = classifyDatasetVersionContent(result.props);
  return outcome.kind === "unavailable"
    ? createErrorProps(res, outcome.statusCode, outcome.statusMessage || DATASET_VERSION_NOT_FOUND)
    : result;
};
