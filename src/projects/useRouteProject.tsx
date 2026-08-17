import { createContext, type ReactNode, useContext } from "react";

import {
  type OrganisationAllDetail,
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetail,
} from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { useOptionalFamilyRoute } from "../application/FamilyRouteBoundary";
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
}) => <RouteProjectContext value={workspace}>{children}</RouteProjectContext>;

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
