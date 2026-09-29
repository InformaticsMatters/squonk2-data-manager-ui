import {
  canonicalFilesystemPath,
  childFilesystemPath,
  filesystemPathOf,
  filesystemRoot,
  parentFilesystemPath,
} from "./fileFacts";

/**
 * A path as the caller types it: project-root relative, separated by `/`, with no leading or
 * trailing separator. This is the one spelling a rename dialog accepts, so what is typed and what
 * the Data Manager is asked for cannot describe different files.
 */
export const relativePathPattern = /^[A-Za-z0-9-_.]+(\/[A-Za-z0-9-_.]+)*$/u;

/** One directory creation, already shaped into what a command may send. */
export type DirectoryCreation =
  { kind: "create"; name: string; path: string } | { kind: "none"; reason: string };

/**
 * Resolves the one directory a create request expresses. A name is a name and not a path, so a
 * caller cannot create a whole tree by typing separators into it, and a name the directory already
 * holds is never sent, because the Data Manager would answer for a directory that already exists
 * rather than the one the caller meant to add.
 */
export const resolveDirectoryCreation = (
  path: string,
  name: string,
  existing: readonly string[],
): DirectoryCreation => {
  const requested = name.trim();
  if (requested === "") {
    return { kind: "none", reason: "Enter a name for the new directory." };
  }
  if (requested.includes("/")) {
    return { kind: "none", reason: "A directory name cannot contain a separator." };
  }
  if (requested === "." || requested === "..") {
    return { kind: "none", reason: "A directory name cannot be a relative path." };
  }
  if (existing.includes(requested)) {
    return { kind: "none", reason: "This directory already exists." };
  }
  const created = canonicalFilesystemPath(childFilesystemPath(path, requested));
  return created === null || created === filesystemRoot
    ? { kind: "none", reason: "This directory name cannot be used." }
    : { kind: "create", name: requested, path: created };
};

/**
 * One move, already shaped into the generated arguments the Data Manager takes for it. A directory
 * moves as a path; a file moves as a name within a path, so the two carry different arguments and
 * are resolved separately rather than by one caller guessing which fields to fill.
 */
export type FileMove =
  | { kind: "move-directory"; destination: string; source: string }
  | { kind: "move-file"; destination: string; destinationPath: string; name: string; path: string }
  | { kind: "none"; reason: string };

/** A move there is something to send for, so a caller past the `none` case need not re-check it. */
export type ResolvedFileMove = Exclude<FileMove, { kind: "none" }>;

const absolute = (relativePath: string) => filesystemPathOf(relativePath.split("/"));

/**
 * The directories whose listings displayed the moved item, and so the ones a move changes. A
 * directory moves as its own path while the listings showing it are its parents, and a file already
 * carries the directories it moved between, so the two kinds answer this differently and neither
 * caller has to work it out. Refreshing the moved path itself would leave the old name on screen in
 * the listing the caller is looking at.
 */
export const listingPathsChangedByMove = (move: ResolvedFileMove): readonly string[] =>
  move.kind === "move-directory"
    ? [parentFilesystemPath(move.source), parentFilesystemPath(move.destination)]
    : [move.path, move.destinationPath];

/**
 * Resolves the one move a rename expresses. Both paths are project-root relative as the caller
 * typed them. A destination equal to the source is never sent, because a move that changes nothing
 * would still report as a rename that happened.
 */
export const resolveFileMove = (
  type: "directory" | "file",
  source: string,
  destination: string,
): FileMove => {
  const requested = destination.trim();
  if (!relativePathPattern.test(requested)) {
    return {
      kind: "none",
      reason: "The path is invalid. It should not start or end with a slash.",
    };
  }
  if (requested === source) {
    return { kind: "none", reason: "This is already the name of this item." };
  }
  if (canonicalFilesystemPath(absolute(requested)) === null) {
    return { kind: "none", reason: "This path cannot be used." };
  }

  if (type === "directory") {
    return { destination: absolute(requested), kind: "move-directory", source: absolute(source) };
  }
  return {
    destination: requested.split("/").at(-1) as string,
    destinationPath: parentFilesystemPath(absolute(requested)),
    kind: "move-file",
    name: source.split("/").at(-1) as string,
    path: parentFilesystemPath(absolute(source)),
  };
};

/** One dataset made from a project file, already shaped into what a command may send. */
export type DatasetCreation =
  | { datasetType: string; fileName: string; kind: "create"; path: string }
  | { kind: "none"; reason: string };

/**
 * Resolves the one dataset a create request expresses. The Data Manager decides a dataset by its
 * type, so a file whose type could not be established is reported rather than sent under a guessed
 * one.
 */
export const resolveDatasetCreation = ({
  fileName,
  mimeType,
  path,
}: {
  fileName: string;
  mimeType: string | undefined;
  path: string;
}): DatasetCreation =>
  mimeType === undefined || mimeType === ""
    ? { kind: "none", reason: "This file's type is not one a dataset can be created from." }
    : { datasetType: mimeType, fileName, kind: "create", path };

/**
 * What a Files command did. Every command answers with one of these rather than with a message, so
 * what happened stays a fact and only its presentation is words.
 */
export type FileCommandOutcome =
  | { kind: "created-dataset"; name: string }
  | { kind: "created-directory"; name: string }
  | { kind: "deleted"; name: string; type: "directory" | "file" }
  | { kind: "detached"; name: string }
  | { kind: "moved"; type: "directory" | "file" }
  | { kind: "unchanged"; reason: string }
  | { kind: "uploaded"; name: string };

export const fileOutcomeMessage = (outcome: FileCommandOutcome): string => {
  switch (outcome.kind) {
    case "created-dataset":
      return `A dataset was created from ${outcome.name}.`;
    case "created-directory":
      return `${outcome.name} was created.`;
    case "deleted":
      return outcome.type === "directory"
        ? `The directory ${outcome.name} was deleted.`
        : `${outcome.name} was deleted.`;
    case "detached":
      return `${outcome.name} was detached from this project.`;
    case "moved":
      return outcome.type === "directory"
        ? "The directory was renamed or moved."
        : "The file was renamed or moved.";
    case "unchanged":
      return outcome.reason;
    case "uploaded":
      return `${outcome.name} was uploaded.`;
  }
};
