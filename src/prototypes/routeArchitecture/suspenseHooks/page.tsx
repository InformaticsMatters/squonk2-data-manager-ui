import { PrototypeFrame } from "../PrototypeFrame";
import { FilesScreen } from "./projects/files/FilesScreen";
import { ProjectRouteBoundary } from "./projects/ProjectRouteBoundary";
import { ProjectShell } from "./projects/ProjectShell";
import { RequestTrace } from "./RequestTrace";

export const SuspenseHooksPage = ({ projectId }: { projectId: string }) => (
  <PrototypeFrame
    projectId={projectId}
    summary="Vertical route-family hooks using the generated clients’ Suspense queries."
    variant="D"
  >
    <RequestTrace />
    <ProjectRouteBoundary projectId={projectId}>
      <ProjectShell projectId={projectId} />
      <FilesScreen projectId={projectId} />
    </ProjectRouteBoundary>
  </PrototypeFrame>
);
