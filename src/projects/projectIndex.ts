import { type UnitsGetResponse } from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import {
  evaluatePersonalUnitCreationCapability,
  evaluateUnitCreationCapability,
  isDefaultOrganisationResource,
  type UnitCreationFacts,
} from "../application/organisationUnits";
import { callerEditsProject, type ProjectCapability } from "./capabilities";

export type ProjectIndexItem = {
  organisationName: string;
  project: ProjectDetail;
  unitName: string;
};

/**
 * A project's container, named where the caller's ancestry names it and identified where it does
 * not. A project always has containers, so an unnamed one still says which container it is: an
 * identifier the caller can quote is worth more than a blank.
 */
const containerName = (
  names: Map<string, string>,
  containerId: string | undefined,
  kind: "Organisation" | "Unit",
) =>
  names.get(containerId ?? "") ??
  (containerId ? `${kind} ${containerId}` : `Unknown containing ${kind.toLocaleLowerCase()}`);

/**
 * The caller's units in one organisation, as their own grouped index reports them. One lookup,
 * because a screen that found them twice could name an organisation's units differently from the
 * names it refuses a new one for clashing with.
 */
const unitGroupOf = (unitsResponse: UnitsGetResponse, organisationId: string) =>
  unitsResponse.units.find(({ organisation }) => organisation.id === organisationId);

export const buildProjectIndexItems = (
  projects: readonly ProjectDetail[],
  unitsResponse: UnitsGetResponse,
  organisationId: string,
  search = "",
): ProjectIndexItem[] => {
  const group = unitGroupOf(unitsResponse, organisationId);
  const unitNames = new Map(group?.units.map((unit) => [unit.id, unit.name]));
  const organisationProjects = projects.filter(
    (project) => project.organisation_id === organisationId,
  );
  const term = search.trim().toLocaleLowerCase();
  return organisationProjects
    .map((project) => ({
      organisationName: group?.organisation.name ?? organisationId,
      project,
      unitName: containerName(unitNames, project.unit_id, "Unit"),
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

/**
 * The unit the projects index offers to create for the organisation in effect, and what that offer
 * may do. `kind` is which unit the organisation can hold, never a different rule about authority:
 * the two evaluators it delegates to are already complementary, because unit creation disables
 * itself in the default organisation and personal-unit creation hides itself outside it.
 */
export type IndexUnitOffer = { capability: ProjectCapability; kind: "named" | "personal" };

/**
 * Which unit offer the projects index makes, from the facts the shared unit-creation rules read.
 *
 * No offer is named while the organisation in effect is unknown, and none is named while the default
 * organisation has not been read either: which unit an organisation holds for a caller is settled by
 * whether it is that one, so an unread default organisation would otherwise fall through to the
 * named arm and offer a caller standing in the default organisation a unit it cannot hold. Both are
 * identity questions rather than authority ones, so neither falls under the rule that keeps an
 * unconfirmed action available — there is nothing yet to make an offer about. Once the organisation
 * is known, unresolved authority behaves as the shared vocabulary already says.
 *
 * A settled read that names no default organisation is an answer rather than a gap: a deployment
 * without one still creates units in the organisations it does have.
 *
 * The personal-unit arm deliberately reads no organisation resource. The Account Server refuses an
 * ordinary caller's addressed read of the default organisation, and it needs no membership of it to
 * give them their own unit, so a refused read never withholds the offer that organisation exists to
 * make.
 */
export const decideIndexUnitOffer = ({
  caller,
  defaultOrganisationId,
  freshness,
  organisation,
  organisationId,
  personalUnitId,
}: UnitCreationFacts): IndexUnitOffer | undefined => {
  if (
    organisationId === undefined ||
    (defaultOrganisationId === undefined && freshness !== "current")
  ) {
    return undefined;
  }
  if (isDefaultOrganisationResource(organisationId, defaultOrganisationId)) {
    return {
      capability: evaluatePersonalUnitCreationCapability({
        freshness,
        isDefaultOrganisation: true,
        personalUnit: personalUnitId === undefined ? "absent" : "present",
      }),
      kind: "personal",
    };
  }
  return {
    capability: evaluateUnitCreationCapability({
      caller,
      // An organisation no read of the caller's names establishes nothing about their authority
      // over it, which is exactly what stale facts mean to every capability.
      freshness: organisation === undefined ? "stale" : freshness,
      isDefaultOrganisation: false,
      organisation: organisation ?? { caller_is_member: false, id: organisationId },
    }),
    kind: "named",
  };
};

/**
 * The names the units of one organisation already hold, which is what a name about to be created
 * is refused for clashing with. A name is display content here and nowhere else: nothing about a
 * unit's meaning is decided by comparing it.
 */
export const unitNamesInOrganisation = (
  unitsResponse: UnitsGetResponse,
  organisationId: string,
): string[] => unitGroupOf(unitsResponse, organisationId)?.units.map(({ name }) => name) ?? [];

/**
 * The names the caller's own reads give to the containers a project declares. Organisations come
 * from the caller's organisation index rather than from their units, because a project may live in
 * an organisation holding no unit of theirs — the selector lists every project they can reach, and
 * a project whose organisation could not be named would be the one hardest to tell apart.
 */
export type ProjectSelectorAncestry = {
  organisations: readonly { id: string; name: string }[];
  units: UnitsGetResponse;
};

/** One project as the selector offers it: what to say about it, and whether it is the one on screen. */
export type ProjectSelectorRow = {
  isUrlProject: boolean;
  organisationName: string;
  projectId: string;
  projectName: string;
  unitName: string;
};

/**
 * One headed run of rows. `startIndex` is where the section begins in the single flat list the
 * keyboard walks, so a highlight crosses from one section into the next without the caller having
 * to know the boundary is there.
 */
export type ProjectSelectorSection = {
  heading: string;
  rows: ProjectSelectorRow[];
  startIndex: number;
};

export type ProjectSelectorList = {
  rows: ProjectSelectorRow[];
  sections: ProjectSelectorSection[];
};

/**
 * Which organisations the project selector may offer. The two arms are named rather than modelled
 * as an optional identifier, so neither can be reached by forgetting to pass something.
 */
export type ProjectSelectorScope =
  | { kind: "every-organisation" }
  | { kind: "organisation"; organisationId: string };

/**
 * How far the project selector reaches, and the only place that answer is given. There is no
 * control offering to change it.
 *
 * It reaches one organisation — the one in effect — which is what the Projects index does, so the
 * two cannot disagree about which projects exist.
 *
 * `every-organisation` is kept whole and kept covered, because the argument for it is a real one
 * and may yet win: scoping hides a project the caller can reach with no control left to reveal it,
 * and searching organisation names does the same job without a mode. Changing this one word is the
 * whole of that change — the derivation, its matrix and the control all already answer for it. It
 * is declared as the union rather than inferred so that either value reads as ordinary code.
 */
export const projectSelectorReach: ProjectSelectorScope["kind"] = "organisation";

/** What narrows the list, beside the collection and ancestry it is drawn from. */
export type ProjectSelectorNarrowing = {
  recentProjectIds: readonly string[];
  scope: ProjectSelectorScope;
  search?: string;
  urlProjectId?: string;
};

const matchesProjectSearch = (row: ProjectSelectorRow, term: string) =>
  !term ||
  row.projectName.toLocaleLowerCase().includes(term) ||
  row.unitName.toLocaleLowerCase().includes(term) ||
  row.organisationName.toLocaleLowerCase().includes(term);

/**
 * The projects the selector offers, ordered as it offers them.
 *
 * Recents answer "take me back" and search answers "find me", so a non-empty search *replaces* the
 * recents rather than narrowing them, and the whole list becomes one counted set of matches. Where
 * both are present a recent is lifted out of the section below rather than repeated in it, and the
 * project the address bar names is left out of the recents — it is not somewhere to go back to —
 * while still being listed and marked, so the caller can see where they are among the alternatives.
 *
 * Every heading counts the rows beneath it rather than the collection it was drawn from, so the
 * counts still add up to the list once a recent has been lifted out of the section below, and to
 * the scope rather than to every project the caller can reach.
 */
export const buildProjectSelectorList = (
  projects: readonly ProjectDetail[],
  ancestry: ProjectSelectorAncestry,
  { recentProjectIds, scope, search = "", urlProjectId }: ProjectSelectorNarrowing,
): ProjectSelectorList => {
  // Scoping happens first, so every count beneath it counts the list the caller is being offered
  // rather than the collection it was drawn from.
  const offered =
    scope.kind === "organisation"
      ? projects.filter(({ organisation_id }) => organisation_id === scope.organisationId)
      : projects;
  const unitNames = new Map(
    ancestry.units.units.flatMap(({ units }) => units.map((unit) => [unit.id, unit.name] as const)),
  );
  const organisationNames = new Map([
    ...ancestry.units.units.map(
      ({ organisation }) => [organisation.id, organisation.name] as const,
    ),
    ...ancestry.organisations.map(({ id, name }) => [id, name] as const),
  ]);
  const term = search.trim().toLocaleLowerCase();
  const matched = offered
    .map<ProjectSelectorRow>((project) => ({
      isUrlProject: project.project_id === urlProjectId,
      organisationName: containerName(organisationNames, project.organisation_id, "Organisation"),
      projectId: project.project_id,
      projectName: project.name,
      unitName: containerName(unitNames, project.unit_id, "Unit"),
    }))
    .filter((row) => matchesProjectSearch(row, term));

  const byProjectId = new Map(matched.map((row) => [row.projectId, row]));
  const recent = term
    ? []
    : recentProjectIds
        // A recent may name a project the caller can no longer reach, which is simply not offered.
        .map((projectId) => (projectId === urlProjectId ? undefined : byProjectId.get(projectId)))
        .filter((row) => row !== undefined);
  const pinned = new Set(recent.map(({ projectId }) => projectId));
  const rest = matched
    .filter(({ projectId }) => !pinned.has(projectId))
    .toSorted(
      (left, right) =>
        left.projectName.localeCompare(right.projectName) ||
        left.unitName.localeCompare(right.unitName),
    );

  const sections: ProjectSelectorSection[] = [];
  if (recent.length > 0) {
    sections.push({ heading: `Recent (${recent.length})`, rows: recent, startIndex: 0 });
  }
  if (rest.length > 0) {
    sections.push({
      heading: term
        ? `${matched.length} of ${offered.length} projects`
        : `All projects (${rest.length})`,
      rows: rest,
      startIndex: recent.length,
    });
  }
  return { rows: [...recent, ...rest], sections };
};
