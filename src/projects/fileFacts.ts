import { type FilePathFile } from "@/api/data-manager";

import { separateFileExtensionFromFileName } from "../utils/app/files";

/** The longest path the Data Manager's generated file arguments accept. */
const maxPathLength = 260;

const hasControlCharacter = (value: string) =>
  [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });

/**
 * The one canonical spelling of a project filesystem path, or `null` for a value that cannot name
 * one at all. Files owns this: a path reaches the section only through its own route, and the route
 * carries exactly one spelling of each directory, so repeated separators and a trailing separator
 * are the same directory as the plain form rather than a second URL for it. `.` and `..` are never
 * resolved, because a path that has to be walked to be understood is a path the caller cannot read
 * off the URL.
 */
export const canonicalFilesystemPath = (value: string): string | null => {
  if (!value.startsWith("/") || value.length > maxPathLength || hasControlCharacter(value)) {
    return null;
  }

  const parts = value.split("/").filter((part) => part !== "");
  if (parts.some((part) => part === "." || part === "..")) {
    return null;
  }
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
};

/** The project root every Files route starts from. */
export const filesystemRoot = "/";

/** The directory names one path walks through, root first, so a caller can address each of them. */
export const filesystemBreadcrumbs = (path: string): string[] =>
  path === filesystemRoot ? [] : path.slice(1).split("/");

/** The path of the directory holding this one; the root holds itself. */
export const parentFilesystemPath = (path: string): string => {
  const breadcrumbs = filesystemBreadcrumbs(path);
  return breadcrumbs.length === 0 ? filesystemRoot : `/${breadcrumbs.slice(0, -1).join("/")}`;
};

/** The path of a named child of this directory. */
export const childFilesystemPath = (path: string, name: string): string =>
  path === filesystemRoot ? `/${name}` : `${path}/${name}`;

/**
 * The path identity a favourite and a job input carry: project-root relative, with no leading
 * separator. It is not the same spelling as a route path, so the two are built here rather than
 * being converted into one another wherever a row is displayed.
 */
export const relativeFilesystemPath = (path: string, name: string): string =>
  path === filesystemRoot ? name : `${path.slice(1)}/${name}`;

/**
 * The generated list arguments every Files read uses. The project in the URL and the path Files
 * owns are both required arguments, so no Files read can be issued against a remembered project
 * selection or against a path another section left behind.
 */
export const projectFileRequests = (projectId: string, path: string) =>
  ({ files: { project_id: projectId, path } }) as const;

/** Files whose content only describes another file, listed beneath the file they describe. */
const nestingExtensions = [".schema.json", ".meta.json"];

type BaseRow = {
  /** The name this file or directory has inside the directory being listed. */
  name: string;
  /** Project-root relative path, the identity favourites and job inputs use. */
  fullPath: string;
};

export type ProjectDirectoryRow = BaseRow & { kind: "directory"; subRows: ProjectFileEntryRow[] };

export type ProjectFileEntryRow = BaseRow & {
  kind: "file";
  data: FilePathFile;
  subRows: ProjectFileEntryRow[];
};

export type ProjectFileRow = ProjectDirectoryRow | ProjectFileEntryRow;

export const isDirectoryRow = (row: ProjectFileRow): row is ProjectDirectoryRow =>
  row.kind === "directory";

/**
 * How the Data Manager holds one file. A file the Data Manager manages as part of a dataset is
 * detached rather than deleted, and an immutable one cannot be replaced, so what a row offers is
 * decided from the generated resource rather than from its name.
 */
export type ProjectFileMode = "editable" | "immutable" | "unmanaged";

export const fileRowMode = (row: ProjectFileEntryRow): ProjectFileMode => {
  if (row.data.immutable === true) {
    return "immutable";
  }
  return row.data.file_id === undefined ? "unmanaged" : "editable";
};

/** A managed file belongs to a dataset, so it is detached from the project rather than deleted. */
export const managedFileId = (row: ProjectFileEntryRow): string | undefined => row.data.file_id;

const toFileRow = (path: string, file: FilePathFile): ProjectFileEntryRow => ({
  data: file,
  fullPath: relativeFilesystemPath(path, file.file_name),
  kind: "file",
  name: file.file_name,
  subRows: [],
});

const describesAnotherFile = (fileName: string) =>
  nestingExtensions.some((extension) => fileName.endsWith(extension));

/**
 * The rows one directory of the addressed project holds: its sub-directories first, then its files,
 * with each file's schema and metadata companions listed beneath the file they describe. Every row
 * takes its identity from the path that was read, so a listing cannot be shown under a directory
 * other than the one it came from.
 */
export const selectProjectFileRows = ({
  files,
  path,
  paths,
}: {
  files: readonly FilePathFile[];
  path: string;
  paths: readonly string[];
}): ProjectFileRow[] => {
  const describing = files.filter((file) => describesAnotherFile(file.file_name));
  const described = files.filter((file) => !describesAnotherFile(file.file_name));

  const directories: ProjectDirectoryRow[] = paths.map((name) => ({
    fullPath: relativeFilesystemPath(path, name),
    kind: "directory",
    name,
    subRows: [],
  }));

  const fileRows: ProjectFileEntryRow[] = described.map((file) => {
    const [stem] = separateFileExtensionFromFileName(file.file_name);
    return {
      ...toFileRow(path, file),
      subRows: describing
        .filter((candidate) => candidate.file_name.startsWith(stem))
        .map((candidate) => toFileRow(path, candidate)),
    };
  });

  return [...directories, ...fileRows];
};

/** The directory names already taken in the directory being listed. */
export const existingDirectoryNames = (rows: readonly ProjectFileRow[]): string[] =>
  rows.filter((row) => isDirectoryRow(row)).map((row) => row.name);
