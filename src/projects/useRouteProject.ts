import { useGetProject } from "@/api/data-manager/project";

import { useRouter } from "next/router";

export const useRouteProject = () => {
  const router = useRouter();
  const projectId = typeof router.query.projectId === "string" ? router.query.projectId : undefined;
  const { data: project } = useGetProject(projectId ?? "", { query: { enabled: !!projectId } });

  return { project, projectId };
};
