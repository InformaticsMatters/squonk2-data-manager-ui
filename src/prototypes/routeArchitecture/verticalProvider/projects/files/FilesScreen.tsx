import { ProjectView } from "../../../PrototypeFrame";
import { useProjectRoute } from "../ProjectRoute";

export const FilesScreen = () => {
  const route = useProjectRoute();

  return (
    <ProjectView
      architecture={[
        "The page and shell consume one readonly ProjectRouteModel.",
        "Only the ProjectRoute implementation knows query ordering and capability derivation.",
        "FilesScreen cannot accidentally reinterpret route scope.",
      ]}
      canEditFiles={route.capabilities.canEditFiles}
      product={route.product}
      project={route.project}
    />
  );
};
