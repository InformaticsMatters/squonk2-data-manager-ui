import { useMemo } from "react";

import { getGetFilesQueryKey, useGetFiles } from "@/api/data-manager/file-and-path";

import { useQueryClient } from "@tanstack/react-query";

import { projectFileRequests, type ProjectFileRow, selectProjectFileRows } from "./fileFacts";
import {
  resolveSectionFreshness,
  resolveSectionReadReport,
  resolveSectionReadState,
  sectionReadFailure,
  type SectionReadReport,
  type SectionReadState,
} from "./sectionReads";

export type ProjectFiles = {
  /** The listing is only as fresh as its own last read. */
  freshness: "current" | "stale";
  isLoading: boolean;
  /** How the listing's own read answered. */
  readState: SectionReadState;
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
  // A refused or absent directory clears its listing, because a path the caller is known to have
  // lost — or never had — must not keep showing what it last held.
  const listing = readState.kind === "unavailable" ? undefined : files.data;

  return {
    freshness: resolveSectionFreshness(readState),
    isLoading: files.isLoading,
    readState,
    refresh: () =>
      void queryClient.invalidateQueries({ queryKey: getGetFilesQueryKey(requests.files) }),
    report: resolveSectionReadReport([readState]),
    retry: () => void files.refetch(),
    rows: selectProjectFileRows({ files: listing?.files ?? [], path, paths: listing?.paths ?? [] }),
  };
};
