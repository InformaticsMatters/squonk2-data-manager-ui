import { PrototypeFrame } from "../PrototypeFrame";
import { FilesScreen } from "./projects/files/FilesScreen";
import { ProjectRoute } from "./projects/ProjectRoute";

export const VerticalProviderPage = ({ projectId }: { projectId: string }) => (
  <PrototypeFrame
    projectId={projectId}
    summary="Vertical route-family module with an immutable route model provider."
    variant="A"
  >
    <ProjectRoute projectId={projectId}>
      <FilesScreen />
    </ProjectRoute>
  </PrototypeFrame>
);
