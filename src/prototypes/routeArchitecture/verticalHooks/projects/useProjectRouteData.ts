import { useQuery } from "@tanstack/react-query";

import { currentUser, getProduct, getProject } from "../../fixtures";

export const useProjectRouteData = (projectId: string) => {
  const project = useQuery({
    queryKey: ["data-manager", "project", projectId],
    queryFn: () => getProject(projectId),
    retry: false,
  });
  const product = useQuery({
    queryKey: ["account-server", "product", project.data?.productId],
    queryFn: () => getProduct(project.data?.productId ?? ""),
    enabled: !!project.data,
    retry: false,
  });

  return { project, product, canEditFiles: !!project.data?.editors.includes(currentUser) };
};
