import { type ServerResponse } from "node:http";

import { createErrorProps } from "../utils/api/serverSidePropsError";
import {
  classifyViewerContent,
  type ViewerContent,
  type ViewerContentOutcome,
} from "../utils/api/viewerContent";

/**
 * Server-rendered content facts for one dataset version, exactly as the viewer transport returned
 * them.
 */
export type DatasetVersionContent = ViewerContent;

export type DatasetVersionContentOutcome = ViewerContentOutcome;

export const DATASET_VERSION_NOT_FOUND = "Dataset version not found";

/**
 * Decides what the viewer shows for the version named by the URL, on the terms every viewer
 * transport is read on.
 */
export const classifyDatasetVersionContent = classifyViewerContent;

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
