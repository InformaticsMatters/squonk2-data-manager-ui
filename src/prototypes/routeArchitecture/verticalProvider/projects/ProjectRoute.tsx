import { createContext, type ReactNode, use, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { currentUser, getProduct, getProject } from "../../fixtures";
import { Loading, NotFound } from "../../PrototypeFrame";
import { projectFilesHref } from "./routes";

type ProjectRouteModel = {
  project: Awaited<ReturnType<typeof getProject>>;
  product: Awaited<ReturnType<typeof getProduct>>;
  capabilities: { canEditFiles: boolean };
  links: { files: string };
};

const ProjectRouteContext = createContext<ProjectRouteModel | null>(null);

export const useProjectRoute = () => {
  const model = use(ProjectRouteContext);
  if (!model) {
    throw new Error("useProjectRoute must be used inside ProjectRoute");
  }
  return model;
};

export const ProjectRoute = ({
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

  const model = useMemo<ProjectRouteModel | null>(() => {
    if (!project.data || !product.data) {
      return null;
    }

    return {
      project: project.data,
      product: product.data,
      capabilities: { canEditFiles: project.data.editors.includes(currentUser) },
      links: { files: projectFilesHref(project.data.id) },
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
  if (product.isError || !model) {
    return <NotFound />;
  }

  return <ProjectRouteContext value={model}>{children}</ProjectRouteContext>;
};
