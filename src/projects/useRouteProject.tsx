import { createContext, type ReactNode, useContext, useEffect } from "react";

import {
  type OrganisationAllDetail,
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetail,
} from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { useSetAtom } from "jotai";

import { useOptionalFamilyRoute } from "../application/FamilyRouteResolution";
import { clearRouteProjectResolution, routeProjectResolutionAtom } from "./routeProjectResolution";
import { localNotFoundProjectId } from "./routes";

export type ProjectWorkspace = {
  organisation: OrganisationAllDetail;
  product: ProductDmProjectTier | ProductDmStorage;
  project: ProjectDetail;
  unit: UnitAllDetail;
};

const RouteProjectContext = createContext<ProjectWorkspace | null>(null);

export const RouteProjectProvider = ({
  children,
  workspace,
}: {
  children: ReactNode;
  workspace: ProjectWorkspace;
}) => {
  const projectId = workspace.project.project_id;
  const setResolution = useSetAtom(routeProjectResolutionAtom);

  // The same workspace, published for the chrome above this provider. See routeProjectResolution.
  useEffect(() => {
    setResolution({ projectId, status: "resolved", workspace });
    return () => setResolution(clearRouteProjectResolution(projectId));
  }, [projectId, setResolution, workspace]);

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

  return {
    organisation: workspace?.organisation,
    product: workspace?.product,
    project: workspace?.project,
    projectId,
    unit: workspace?.unit,
  };
};
