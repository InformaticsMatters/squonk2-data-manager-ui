import { Loading, NotFound, ProjectView } from "../../../PrototypeFrame";
import { useProjectRouteData } from "../useProjectRouteData";

export const FilesScreen = ({ projectId }: { projectId: string }) => {
  const route = useProjectRouteData(projectId);

  if (route.project.isPending) {
    return <Loading />;
  }
  if (route.project.isError) {
    return <NotFound />;
  }
  if (route.product.isPending) {
    return <Loading />;
  }
  if (route.product.isError) {
    return <NotFound />;
  }

  return (
    <ProjectView
      architecture={[
        "The page passes projectId to shell and feature call sites.",
        "Each caller invokes the composition hook; React Query deduplicates network requests.",
        "Callers can select only what they need, but they know resolution and failure rules.",
      ]}
      canEditFiles={route.canEditFiles}
      product={route.product.data}
      project={route.project.data}
    />
  );
};
