import { getGetFilesQueryKey } from "@/api/data-manager/file-and-path";

import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { CenterLoader } from "../components/CenterLoader";
import { NextLink } from "../components/NextLink";
import {
  childFilesystemPath,
  isDirectoryRow,
  type ProjectFileEntryRow,
  projectFileRequests,
  type ProjectFileRow,
} from "./fileFacts";
import { fileViewerLabels, VIEWER_CONTENT_MAX_BYTES } from "./fileViewers";
import { MarkdownViewer } from "./MarkdownViewer";
import { projectFileTransportLinks, projectLinks } from "./routes";
import { SectionReadAlerts } from "./SectionReadAlerts";
import {
  resolveSectionReadReport,
  resolveSectionReadState,
  sectionReadFailure,
} from "./sectionReads";

/** The file a directory is introduced by: one named `README.md`, in any case. */
export const findReadmeRow = (rows: readonly ProjectFileRow[]) =>
  rows.find(
    (row): row is ProjectFileEntryRow =>
      !isDirectoryRow(row) && row.name.toLowerCase() === "readme.md",
  );

/**
 * The README of the listed directory, formatted below the listing as GitHub shows one. The browser
 * reads it through the download transport; a failed read is reported here alone, so a README that
 * cannot be read never breaks the listing above it.
 */
export const ProjectReadme = ({
  path,
  projectId,
  row,
}: {
  /** Absolute path of the listed directory, which the README's links resolve against. */
  path: string;
  projectId: string;
  row: ProjectFileEntryRow;
}) => {
  const filePath = childFilesystemPath(path, row.name);
  const tooLarge = row.data.stat.size > VIEWER_CONTENT_MAX_BYTES;
  const viewerName = fileViewerLabels.markdown.name;
  const readme = useQuery({
    enabled: !tooLarge,
    queryFn: async () => {
      const response = await fetch(projectFileTransportLinks.download(projectId, filePath));
      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- classified by its status
        throw response;
      }
      return response.text();
    },
    // Beneath the listing's own key, so refreshing the listing re-reads its README too.
    queryKey: [
      ...getGetFilesQueryKey(projectFileRequests(projectId, path).files),
      "readme",
      row.name,
    ],
    retry: false,
  });
  const readState = resolveSectionReadState(sectionReadFailure(readme));

  return (
    <Box aria-label={row.name} component="section" sx={{ mt: 3 }}>
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 2 }}>
        <Typography component="h2" variant="h6">
          {row.name}
        </Typography>
        <NextLink
          component="a"
          href={projectLinks.fileView(projectId, { path: filePath, viewer: "markdown" }) as never}
          sx={{ textTransform: "none" }}
        >
          Open in {viewerName}
        </NextLink>
      </Box>
      {tooLarge ? (
        <Typography color="text.secondary">
          This README is too large to show here. Open it in the {viewerName} instead.
        </Typography>
      ) : (
        <>
          <SectionReadAlerts
            report={resolveSectionReadReport([readState])}
            retryableMessage="This README could not be loaded."
            unavailableMessage="This README is unavailable or you no longer have access to it."
            onRetry={() => void readme.refetch()}
          />
          {readme.isLoading ? <CenterLoader /> : null}
          {readme.data === undefined || readState.kind === "unavailable" ? null : (
            <MarkdownViewer
              content={readme.data}
              directory={path}
              projectId={projectId}
              truncated={false}
            />
          )}
        </>
      )}
    </Box>
  );
};
