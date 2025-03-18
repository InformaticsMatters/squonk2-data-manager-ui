import { type UnitAllDetail } from "@squonk/account-server-client";
import { useGetOrganisationUnits } from "@squonk/account-server-client/unit";
import { type ProjectDetail } from "@squonk/data-manager-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import {
  filterProjectsByPermissionLevel,
  type PermissionLevel,
} from "../components/userContext/filter";
import { useSelectedOrganisation } from "../state/organisationSelection";

export const getUserFilter =
  (level: PermissionLevel, user: string | undefined, projects: ProjectDetail[] | undefined) =>
  (unit: UnitAllDetail) => {
    if (level === "none") {
      return true;
    }
    const projectsForUnit = projects?.filter((project) => project.unit_id === unit.id) ?? [];
    return (
      unit.caller_is_member ||
      filterProjectsByPermissionLevel(level, user, projectsForUnit).length > 0
    );
  };

export const useGetVisibleUnits = (level: PermissionLevel, user: string | undefined) => {
  const { data: projects, isLoading: isProjectsLoading } = useGetProjects(undefined, {
    query: { select: (data) => data.projects },
  });

  const [organisation] = useSelectedOrganisation();
  const userFilter = getUserFilter(level, user, projects);

  const organisationId = organisation?.id ?? "";
  const {
    data: units,
    isLoading: isUnitsLoading,
    error,
    ...extra
  } = useGetOrganisationUnits(organisationId, {
    query: {
      enabled: !!organisationId,
      select: ({ units }) => units.filter((element) => userFilter(element)),
    },
  });

  return { ...extra, isLoading: isProjectsLoading || isUnitsLoading, data: units, error };
};
