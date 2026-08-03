import { createContext, type ReactNode, useContext } from "react";

import {
  type OrganisationAllDetail,
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetail,
} from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { useOptionalFamilyRoute } from "../application/FamilyRouteBoundary";

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

export const useRouteProjectId = () => {
  const familyRoute = useOptionalFamilyRoute();
  const route = !familyRoute || familyRoute.localNotFound ? null : familyRoute.route;
  return route && "projectId" in route ? route.projectId : undefined;
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
