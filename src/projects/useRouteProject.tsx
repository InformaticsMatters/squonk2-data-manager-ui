import { createContext, type ReactNode, useContext, useMemo } from "react";

import { type ProjectDetail } from "@/api/data-manager";

import { useOptionalFamilyRoute } from "../application/FamilyRouteResolution";
import { type ProjectAncestryRead } from "./projectAncestry";
import { usePublishRouteProjectResolution } from "./routeProjectResolution";
import { localNotFoundProjectId } from "./routes";

/**
 * The project the URL addresses, and where it sits in the Account Server. The project is the whole
 * of what a section needs to read, list, and change; its ancestry is a second read that a caller
 * outside the project's unit is refused, so it is carried as its own outcome rather than as a
 * precondition of having a project at all.
 */
export type ProjectWorkspace = { ancestry: ProjectAncestryRead; project: ProjectDetail };

const RouteProjectContext = createContext<ProjectWorkspace | null>(null);

export const RouteProjectProvider = ({
  children,
  workspace,
}: {
  children: ReactNode;
  workspace: ProjectWorkspace;
}) => {
  // The same workspace, published for the chrome above this provider. See routeProjectResolution.
  usePublishRouteProjectResolution(
    useMemo(
      () => ({ projectId: workspace.project.project_id, status: "resolved" as const, workspace }),
      [workspace],
    ),
  );

  return <RouteProjectContext value={workspace}>{children}</RouteProjectContext>;
};

/**
 * The project the URL addresses. A child route the section could not address still names the
 * project it was addressed beneath, so a malformed child keeps the project workspace mounted
 * instead of losing the parent along with the child.
 */
export const useRouteProjectId = () => {
  const familyRoute = useOptionalFamilyRoute();
  if (!familyRoute) {
    return undefined;
  }
  if (familyRoute.localNotFound) {
    return localNotFoundProjectId(familyRoute.parent);
  }
  return "projectId" in familyRoute.route ? familyRoute.route.projectId : undefined;
};

export const useRouteProject = () => {
  const projectId = useRouteProjectId();
  const workspace = useContext(RouteProjectContext);

  return { ancestry: workspace?.ancestry, project: workspace?.project, projectId };
};
