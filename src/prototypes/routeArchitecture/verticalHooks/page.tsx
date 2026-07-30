import { PrototypeFrame } from "../PrototypeFrame";
import { FilesScreen } from "./projects/files/FilesScreen";

export const VerticalHooksPage = ({ projectId }: { projectId: string }) => (
  <PrototypeFrame
    projectId={projectId}
    summary="Vertical route-family module whose consumers independently invoke shared query hooks."
    variant="B"
  >
    <FilesScreen projectId={projectId} />
  </PrototypeFrame>
);
