import { ProjectView } from "../PrototypeFrame";
import { useApplicationScope } from "./applicationScope";

export const ProjectFilesFeature = () => {
  const scope = useApplicationScope();

  return (
    <ProjectView
      architecture={[
        "Existing horizontal features consume one application-wide scope interface.",
        "One central module knows every route-scope shape and cross-service query.",
        "Adding Datasets and Administration grows the shared union and capability surface.",
      ]}
      canEditFiles={scope.canEditCurrentProject}
      product={scope.product}
      project={scope.project}
    />
  );
};
