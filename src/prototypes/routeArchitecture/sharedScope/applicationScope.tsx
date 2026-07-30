import { createContext, type ReactNode, use, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { currentUser, getProduct, getProject } from "../fixtures";
import { Loading, NotFound } from "../PrototypeFrame";

type ApplicationScope = {
  kind: "project";
  project: Awaited<ReturnType<typeof getProject>>;
  product: Awaited<ReturnType<typeof getProduct>>;
  canEditCurrentProject: boolean;
};

const ApplicationScopeContext = createContext<ApplicationScope | null>(null);

export const useApplicationScope = () => {
  const scope = use(ApplicationScopeContext);
  if (!scope) {
    throw new Error("useApplicationScope must be used inside ApplicationScopeBoundary");
  }
  return scope;
};

export const ApplicationScopeBoundary = ({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) => {
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

  const scope = useMemo<ApplicationScope | null>(() => {
    if (!project.data || !product.data) {
      return null;
    }

    return {
      kind: "project",
      project: project.data,
      product: product.data,
      canEditCurrentProject: project.data.editors.includes(currentUser),
    };
  }, [product.data, project.data]);

  if (project.isPending) {
    return <Loading />;
  }
  if (project.isError) {
    return <NotFound />;
  }
  if (product.isPending) {
    return <Loading />;
  }
  if (product.isError || !scope) {
    return <NotFound />;
  }

  return <ApplicationScopeContext value={scope}>{children}</ApplicationScopeContext>;
};
