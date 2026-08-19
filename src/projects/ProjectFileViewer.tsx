import { type ReactNode } from "react";

import { ArrowBack, OpenInNew } from "@mui/icons-material";
import { Box, Button, Container, Link, Typography } from "@mui/material";
import NextError from "next/error";
import A from "next/link";

import { type FamilyRoute } from "../application/familyRoute";
import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { PlaintextViewer } from "../features/PlaintextViewer";
import { SDFViewer } from "../features/SDFViewer";
import { type ProjectId } from "../routing/identifiers";
import { type FilesystemFile, filesystemFile } from "./fileFacts";
import {
  defaultFileViewer,
  FILE_NOT_FOUND_NOTICE,
  type FileViewer,
  type FileViewerDelivery,
  fileViewerLabels,
  fileViewersFor,
  isCompressedFileName,
  offersFileViewer,
} from "./fileViewers";
import { ProjectFilesSection } from "./ProjectFiles";
import { projectFileTransportLinks, projectLinks, type ProjectRoute } from "./routes";
import { SectionReadAlerts } from "./SectionReadAlerts";
import { resolveProjectSectionRoute } from "./sectionRoute";

type FileViewRoute = Extract<ProjectRoute, { kind: "file-view" }>;

const isFileViewRoute = (route: FamilyRoute): route is FileViewRoute => route.kind === "file-view";

/** A viewer a file does not offer is an address Files cannot serve, however valid the file is. */
const WRONG_VIEWER_NOTICE = "This file cannot be shown in that viewer.";

const UNDELIVERED_CONTENT = "This file's content could not be loaded. Retry this exact file.";

/**
 * What the page established about this file server-side, on the same terms for every viewer: the
 * server-rendered viewer's own bytes, or that the file answered for a viewer which fetches them
 * itself.
 */
export type ProjectFileViewerProps = { delivery: FileViewerDelivery };

/**
 * One file of the project in the URL, shown in the viewer the URL names. Project identity, the
 * file's own path, the viewer, and every transport come from that one route, so a viewer can never
 * be showing a file of a project other than the one around it, and returning from it lands in the
 * directory the file is actually in.
 */
export const ProjectFileViewer = ({ delivery }: ProjectFileViewerProps) => {
  const section = resolveProjectSectionRoute(useFamilyRoute(), isFileViewRoute);

  switch (section.kind) {
    case "not-found":
      return <NextError statusCode={404} />;
    // A file path the section could not address keeps the project and answers for the file in
    // Files itself rather than guessing a correction for it.
    case "local-not-found":
      return (
        <ProjectFilesSection
          notice={FILE_NOT_FOUND_NOTICE}
          route={{ kind: "files", projectId: section.projectId }}
        />
      );
    case "route":
      return <AddressedFile delivery={delivery} route={section.route} />;
  }
};

const AddressedFile = ({ delivery, route }: ProjectFileViewerProps & { route: FileViewRoute }) => {
  const { projectId } = route;
  const file = filesystemFile(route.path);
  const viewer = route.viewer ?? defaultFileViewer;

  // Absence, refusal, and a file this viewer cannot show are all answered in Files beneath the same
  // project, so the project shell and a usable listing survive every one of them.
  if (file === null) {
    return (
      <ProjectFilesSection notice={FILE_NOT_FOUND_NOTICE} route={{ kind: "files", projectId }} />
    );
  }
  if (!offersFileViewer(file.name, viewer)) {
    return (
      <ProjectFilesSection
        notice={WRONG_VIEWER_NOTICE}
        route={{ kind: "files", path: file.directory, projectId }}
      />
    );
  }
  if (delivery.kind === "missing") {
    return (
      <ProjectFilesSection
        notice={FILE_NOT_FOUND_NOTICE}
        route={{ kind: "files", path: file.directory, projectId }}
      />
    );
  }

  return (
    <FileViewerFrame file={file} projectId={projectId} viewer={viewer}>
      <FileViewerBody delivery={delivery} file={file} projectId={projectId} viewer={viewer} />
    </FileViewerFrame>
  );
};

/**
 * The frame every viewer is shown in: an explicit return to the directory the file is in, and the
 * other viewers the same file offers. Both replace the viewer rather than stacking it, so Back
 * leaves the file for the listing it was opened from whichever viewer the caller ended up in.
 */
const FileViewerFrame = ({
  children,
  file,
  projectId,
  viewer,
}: {
  children: ReactNode;
  file: FilesystemFile;
  projectId: ProjectId;
  viewer: FileViewer;
}) => (
  <Container maxWidth="xl" sx={{ py: 3 }}>
    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
      <Button
        replace
        component={A}
        href={projectLinks.files(projectId, { path: file.directory })}
        startIcon={<ArrowBack />}
      >
        Back to files
      </Button>
      {fileViewersFor(file.name).map((offered) => (
        <Button
          replace
          component={A}
          href={projectLinks.fileView(projectId, { path: file.path, viewer: offered }) as never}
          key={offered}
          size="small"
          variant={offered === viewer ? "contained" : "outlined"}
        >
          {fileViewerLabels[offered].name}
        </Button>
      ))}
    </Box>
    {children}
  </Container>
);

const FileViewerBody = ({
  delivery,
  file,
  projectId,
  viewer,
}: ProjectFileViewerProps & { file: FilesystemFile; projectId: ProjectId; viewer: FileViewer }) => {
  // Content that could not be delivered is the same open question for every viewer: the file is
  // never claimed to be missing, and the exact same file is what a retry addresses.
  if (delivery.kind === "recoverable") {
    return (
      <SectionReadAlerts
        report={{ retryable: true, unavailable: false }}
        retryableMessage={UNDELIVERED_CONTENT}
        unavailableMessage={FILE_NOT_FOUND_NOTICE}
        onRetry={() => globalThis.location.reload()}
      />
    );
  }
  if (delivery.kind === "failed") {
    return <NextError statusCode={delivery.statusCode} statusMessage={delivery.statusMessage} />;
  }

  switch (viewer) {
    case "text":
      return delivery.kind === "content" ? (
        <PlaintextViewer
          {...delivery.content}
          compressed={isCompressedFileName(file.name)}
          title={file.path}
        />
      ) : (
        <NextError statusCode={500} />
      );
    case "browser":
      return <BrowserFile file={file} projectId={projectId} />;
    case "sdf":
      return <SDFViewer path={file.path} projectId={projectId} />;
  }
};

/**
 * The file as the browser itself renders it, served through the viewer proxy that forces inline
 * display. It stays inside the project workspace, so refreshing it keeps the file's own URL, and
 * the same transport is offered on its own for a file the browser would rather download.
 */
const BrowserFile = ({ file, projectId }: { file: FilesystemFile; projectId: ProjectId }) => {
  const transport = projectFileTransportLinks.browserView(projectId, file.path);

  return (
    <>
      <Box sx={{ alignItems: "center", display: "flex", gap: 2, mb: 1 }}>
        <Typography component="h1" sx={{ wordBreak: "break-all" }} variant="h6">
          {file.path}
        </Typography>
        <Link
          href={transport}
          rel="noopener noreferrer"
          sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}
          target="_blank"
        >
          Open in a new tab
          <OpenInNew fontSize="inherit" />
        </Link>
      </Box>
      {/* A project's files are content this application does not control, and the proxy serves them
          inline under this origin, so the frame is granted nothing: a file that happens to be a
          document cannot run script, reach this page, or act as the signed-in caller. Anything the
          frame refuses to show is still the caller's own to open through the link above. */}
      <Box
        component="iframe"
        sandbox=""
        src={transport}
        sx={{ border: 0, height: "calc(100vh - 260px)", width: "100%" }}
        title={`${file.name} in the browser viewer`}
      />
    </>
  );
};
