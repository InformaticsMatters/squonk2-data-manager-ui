import { type UnitsGetResponse } from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { callerEditsProject } from "./capabilities";

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

/**
 * Whether the caller is offered a way into a project of their own, and what that offer may do.
 *
 * `personalUnitStepApplies` is false for a caller who already has a personal unit, so nothing
 * offers them a second one. `dismissible` is false for a caller with no project they can write to,
 * because the offer is then the only route into work of their own and dismissing it would leave
 * them exactly where onboarding exists to rescue them from.
 */
export type ProjectOnboardingDecision = {
  dismissible: boolean;
  offered: boolean;
  personalUnitStepApplies: boolean;
};

/**
 * Whether opening Projects offers onboarding, from the project collection, the caller's username
 * and the caller's personal unit identity — all of which the index already reads.
 *
 * The two arms are a deliberate disjunction. The first reaches everyone without a sandbox of their
 * own, including a collaborator already productive in someone else's unit; the second reaches
 * anyone with no writable project anywhere, which is what makes their offer permanent rather than
 * dismissible. A project the caller merely created, or one a platform administrator holds no role
 * in, is not one they can write to: `callerEditsProject` is the single definition of that.
 */
export const decideProjectOnboarding = (
  projects: readonly ProjectDetail[],
  username: string | undefined,
  personalUnitId: string | undefined,
): ProjectOnboardingDecision => {
  // No personal unit means no project in one, so the absent unit needs no separate arm.
  const ownsPersonalProject =
    personalUnitId !== undefined && projects.some(({ unit_id }) => unit_id === personalUnitId);
  const editsSomeProject = projects.some((project) => callerEditsProject(project, username));
  const offered = !ownsPersonalProject || !editsSomeProject;
  return {
    dismissible: offered && editsSomeProject,
    offered,
    personalUnitStepApplies: personalUnitId === undefined,
  };
};
