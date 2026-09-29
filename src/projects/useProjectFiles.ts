import { useMemo } from "react";

import { getGetFilesQueryKey, useGetFiles } from "@/api/data-manager/file-and-path";

import { useQueryClient } from "@tanstack/react-query";

import {
  type ProjectFileContent,
  projectFileRequests,
  type ProjectFileRow,
  resolveProjectFileContent,
  selectProjectFileRows,
} from "./fileFacts";
import {
  readableContent,
  resolveSectionReadReport,
  resolveSectionReadState,
  sectionReadFailure,
  type SectionReadReport,
} from "./sectionReads";

export type ProjectFiles = {
  /**
   * What the listing could last establish about the directory. A refused, absent, or not-yet-read
   * listing establishes as little as a stale one, so each is told apart from one that answered.
   */
  content: ProjectFileContent;
  isLoading: boolean;
  /** Refreshes the displayed directory without changing which directory is displayed. */
  refresh: () => void;
  /** What the section must tell the caller about the read it made. */
  report: SectionReadReport;
  /** Retries the read that failed, leaving the addressed project and path untouched. */
  retry: () => void;
  /** Everything the addressed directory holds, sub-directories first. */
  rows: ProjectFileRow[];
};

/**
 * Composes the Files listing from the generated file-and-path collection. The project in the URL
 * and the path Files owns are both required arguments of that read, and its generated query options
 * remain the only cache identity for it, so the section keeps no aggregate of its own and cannot
 * list a directory of a project other than the addressed one.
 */
export const useProjectFiles = (projectId: string, path: string): ProjectFiles => {
  const queryClient = useQueryClient();
  const requests = useMemo(() => projectFileRequests(projectId, path), [projectId, path]);

  const files = useGetFiles(requests.files, { query: { retry: false } });

  const readState = resolveSectionReadState(sectionReadFailure(files));
  // A directory the read has not answered for yet establishes nothing about what it holds, so it is
  // not treated as current merely for having failed at nothing. Content already in hand — cached or
  // being refreshed behind what is on screen — has answered.
  const hasAnswered = files.data !== undefined;

  return {
    content: resolveProjectFileContent(readState, hasAnswered),
    isLoading: files.isLoading,
    refresh: () =>
      void queryClient.invalidateQueries({ queryKey: getGetFilesQueryKey(requests.files) }),
    report: resolveSectionReadReport([readState]),
    retry: () => void files.refetch(),
    // Content the caller is known to have lost access to is not shown, however recently it loaded,
    // on the same terms every other project section drops it.
    rows: selectProjectFileRows({
      files: readableContent(readState, files.data?.files),
      path,
      paths: readableContent(readState, files.data?.paths),
    }),
  };
};
