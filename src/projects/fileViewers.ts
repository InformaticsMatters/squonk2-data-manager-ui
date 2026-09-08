import { type ServerResponse } from "node:http";

import { type Successful } from "../utils/api/plaintextViewerSSR";
import { createErrorProps } from "../utils/api/serverSidePropsError";
import { classifyViewerContent, type ViewerContent } from "../utils/api/viewerContent";

/**
 * How a project file can be shown. Files owns this list: a viewer is part of the file's address,
 * so which viewers exist, which of them a file offers, and which one a URL that names none means
 * are all decided here rather than at each link.
 */
export const fileViewers = ["text", "browser"] as const;

export type FileViewer = (typeof fileViewers)[number];

/**
 * The viewer every file offers, and therefore the one a route carries no viewer for. Naming it in a
 * URL would be a second spelling of the same view, so the route drops it exactly as Files drops the
 * root from a directory link.
 */
export const defaultFileViewer: FileViewer = "text";

export const isFileViewer = (value: string): value is FileViewer =>
  fileViewers.includes(value as FileViewer);

/** What Files answers with for a file it was addressed beneath but could not show. */
export const FILE_NOT_FOUND_NOTICE = "This file was not found in this project.";

const compressedExtensions = [".gz", ".gzip"];

const hasExtension = (fileName: string, extensions: readonly string[]) =>
  extensions.some((extension) => fileName.endsWith(extension));

/**
 * What each viewer needs of the file it shows. A viewer with no requirement shows any file the
 * project holds; the rest state their own, so a file's viewers are decided in one place rather than
 * at each list that offers them.
 */
const viewerRequirements: Record<FileViewer, (fileName: string) => boolean> = {
  browser: () => true,
  text: () => true,
};

/** How each viewer presents itself wherever one is offered or named. */
export const fileViewerLabels: Record<FileViewer, { name: string; summary: string }> = {
  browser: {
    name: "Browser Viewer",
    summary: "Displays the file in your browser if it supports the file type",
  },
  text: { name: "Plaintext Viewer", summary: "Displays the file as plaintext" },
};

/**
 * Whether the Data Manager holds this file compressed. It is read off the name the Data Manager
 * lists the file under, which is the only thing that says so, and it decides both what the
 * server-rendered viewer must decompress and what the viewer tells the caller it did.
 */
export const isCompressedFileName = (fileName: string): boolean =>
  hasExtension(fileName, compressedExtensions);

/** The viewers this file offers, in the one order every list of them is shown in. */
export const fileViewersFor = (fileName: string): FileViewer[] =>
  fileViewers.filter((viewer) => viewerRequirements[viewer](fileName));

/**
 * Whether this file can be shown in this viewer. A viewer a file does not offer is an address the
 * section cannot serve, so it is answered locally rather than by rendering an empty viewer.
 */
export const offersFileViewer = (fileName: string, viewer: FileViewer): boolean =>
  viewerRequirements[viewer](fileName);

/**
 * What the page established about the file before the viewer was framed. `readable` is a file that
 * answered for a viewer which fetches the bytes itself; `content` is the server-rendered viewer's
 * own bytes. Every viewer is therefore told the same thing about absence, refusal, and a delivery
 * that merely failed, whichever transport it goes on to use.
 */
export type FileViewerDelivery =
  | { kind: "content"; content: Successful }
  | { kind: "failed"; statusCode: number; statusMessage: string }
  | { kind: "readable" }
  | { kind: "recoverable" }
  | { kind: "unavailable"; statusCode: number; statusMessage: string };

/**
 * Turns one transport answer into what the viewer shows. A file the Data Manager will not deliver
 * is answered in the status the Data Manager gave and in its own words, in the response as well as
 * the page, so a file that is not there and a file this caller may not read are told apart;
 * anything that merely failed to arrive stays retryable against the same file rather than being
 * reported as a file that is not there.
 *
 * A refusal used to be answered exactly as an absence, so the viewer transport could not be used to
 * discover which files a project holds. That is dropped, per the audit this work comes from: the
 * Data Manager already distinguishes the two to anyone calling it directly, so the concealment cost
 * every caller the one sentence naming what was actually wrong — a mistyped path, a file another
 * caller owns, a project no longer readable — and concealed nothing from anyone who could ask the
 * service instead.
 *
 * The reason arrived from outside this application, so it reaches the status line only through
 * `createErrorProps`; the section's own notice stands in where the service accounted for nothing.
 *
 * `null` is a file that answered and had nothing to deliver here, which is what a viewer fetching
 * its own bytes asks for.
 */
export const resolveFileViewerDelivery = (
  res: ServerResponse,
  content: ViewerContent | null,
): FileViewerDelivery => {
  if (content === null) {
    return { kind: "readable" };
  }
  const outcome = classifyViewerContent(content);
  if (outcome.kind === "unavailable") {
    const { props } = createErrorProps(
      res,
      outcome.statusCode,
      outcome.statusMessage || FILE_NOT_FOUND_NOTICE,
    );
    return {
      kind: "unavailable",
      statusCode: props.statusCode,
      statusMessage: props.statusMessage,
    };
  }
  return outcome;
};
