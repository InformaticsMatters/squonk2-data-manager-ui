import { PrototypeFrame } from "../PrototypeFrame";
import { ApplicationScopeBoundary } from "./applicationScope";
import { ProjectFilesFeature } from "./ProjectFilesFeature";

export const SharedScopePage = ({ projectId }: { projectId: string }) => (
  <PrototypeFrame
    projectId={projectId}
    summary="Current horizontal folders retained behind one central application-scope module."
    variant="C"
  >
    <ApplicationScopeBoundary projectId={projectId}>
      <ProjectFilesFeature />
    </ApplicationScopeBoundary>
  </PrototypeFrame>
);
