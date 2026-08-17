import { type UnitsGetResponse } from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

export type ProjectIndexItem = {
  organisationName: string;
  project: ProjectDetail;
  unitName: string;
};

export const buildProjectIndexItems = (
  projects: readonly ProjectDetail[],
  unitsResponse: UnitsGetResponse,
  organisationId: string,
  search = "",
): ProjectIndexItem[] => {
  const group = unitsResponse.units.find(({ organisation }) => organisation.id === organisationId);
  const unitNames = new Map(group?.units.map((unit) => [unit.id, unit.name]));
  const organisationProjects = projects.filter(
    (project) => project.organisation_id === organisationId,
  );
  const term = search.trim().toLocaleLowerCase();
  return organisationProjects
    .map((project) => ({
      organisationName: group?.organisation.name ?? organisationId,
      project,
      unitName:
        unitNames.get(project.unit_id ?? "") ??
        (project.unit_id ? `Unit ${project.unit_id}` : "Unknown containing unit"),
    }))
    .filter(
      ({ project, unitName }) =>
        !term ||
        project.name.toLocaleLowerCase().includes(term) ||
        unitName.toLocaleLowerCase().includes(term),
    )
    .toSorted(
      (left, right) =>
        left.project.name.localeCompare(right.project.name) ||
        left.unitName.localeCompare(right.unitName),
    );
};
