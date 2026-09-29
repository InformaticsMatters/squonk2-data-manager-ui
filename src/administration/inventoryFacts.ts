import { type UnitAllDetail } from "@/api/account-server";
import {
  type InventoryUserDetail,
  type InventoryUserDetailProjects,
  type InventoryUserGetResponse,
  type UserActivityDetail,
} from "@/api/data-manager";

import {
  classifyTransportFailure,
  type TransportFailure,
} from "../api/runtime/classifyTransportFailure";
import { administrationReadIsAuthoritative } from "./failures";

/** The usage facts every report states about one user, whichever resource is addressed. */
export type InventoryUserFacts = {
  activity: UserActivityDetail;
  /** How many datasets the user holds each role in; the inventory omits a role it has none for. */
  datasets: { editor: number; owner: number };
  firstSeen: string;
  lastSeen: string;
  projects: InventoryUserDetailProjects;
  username: string;
};

/** One unit a user works in, with how many of that unit's projects the user may change. */
export type InventoryUnitUsage = {
  id: string;
  /** Absent when the caller's own unit index does not name the unit, which stays readable by ID. */
  name?: string;
  projectCount: number;
};

export type OrganisationInventoryRow = InventoryUserFacts & { units: InventoryUnitUsage[] };

export type UnitInventoryRow = InventoryUserFacts & { isMember: boolean };

/** One project the inventory named, with everyone reported as holding a role in it. */
export type InventoryProjectRow = {
  administrators: string[];
  editors: string[];
  name: string;
  observers: string[];
  projectId: string;
};

const userFacts = (user: InventoryUserDetail): InventoryUserFacts => ({
  activity: user.activity,
  datasets: { editor: user.datasets.editor?.length ?? 0, owner: user.datasets.owner?.length ?? 0 },
  firstSeen: user.first_seen,
  lastSeen: user.last_seen_date,
  projects: user.projects,
  username: user.username,
});

/** Observing a project is not working in the unit that holds it, so only changeable roles count. */
const changeableProjects = (user: InventoryUserDetail) => [
  ...user.projects.administrator,
  ...user.projects.editor,
];

const holdsAnyRole = (projects: InventoryUserDetailProjects) =>
  projects.administrator.length + projects.editor.length + projects.observer.length > 0;

const unitHolds = (unit: UnitAllDetail, username: string) =>
  unit.owner_id === username || unit.users.some((user) => user.id === username);

/**
 * The units of one organisation a user is connected to: those holding projects the user may change,
 * counted from the inventory itself, and those the user belongs to or owns, which the inventory
 * named no such project for. A unit the given list does not name keeps its identity and loses
 * nothing but its name.
 */
const unitsOfUser = (user: InventoryUserDetail, units: UnitAllDetail[]): InventoryUnitUsage[] => {
  const projectCounts = new Map<string, number>();
  for (const project of changeableProjects(user)) {
    projectCounts.set(project.unit_id, (projectCounts.get(project.unit_id) ?? 0) + 1);
  }
  for (const unit of units) {
    if (!projectCounts.has(unit.id) && unitHolds(unit, user.username)) {
      projectCounts.set(unit.id, 0);
    }
  }
  return [...projectCounts].map(([id, projectCount]) => ({
    id,
    name: units.find((unit) => unit.id === id)?.name,
    projectCount,
  }));
};

/**
 * An organisation report accounts for the users its inventory named against that organisation's own
 * units. A user connected to none of them is not part of this organisation's report.
 */
export const organisationInventoryRows = ({
  inventory,
  units,
}: {
  inventory: InventoryUserGetResponse;
  /** The addressed organisation's own units, as that organisation's resource reports them. */
  units: UnitAllDetail[];
}): OrganisationInventoryRow[] =>
  inventory.users
    .map((user) => ({ ...userFacts(user), units: unitsOfUser(user, units) }))
    .filter((row) => row.units.length > 0);

/**
 * A unit report accounts for everyone the inventory named who holds a project role, plus the unit's
 * own members and owner, so a member who has not started work is still accounted for.
 */
export const unitInventoryRows = ({
  inventory,
  unit,
}: {
  inventory: InventoryUserGetResponse;
  unit: UnitAllDetail;
}): UnitInventoryRow[] =>
  inventory.users
    .map((user) => ({ ...userFacts(user), isMember: unitHolds(unit, user.username) }))
    .filter((row) => row.isMember || holdsAnyRole(row.projects));

/**
 * The same inventory read from the project's side. Roles are reported here and changed on each
 * project's own Manage route, so the pivot invents no project the inventory did not name.
 */
export const pivotInventoryByProject = (users: InventoryUserDetail[]): InventoryProjectRow[] => {
  const projects = new Map<string, InventoryProjectRow>();
  const rowFor = ({ id, name }: { id: string; name: string }) => {
    const existing = projects.get(id);
    if (existing) {
      return existing;
    }
    const created: InventoryProjectRow = {
      administrators: [],
      editors: [],
      name,
      observers: [],
      projectId: id,
    };
    projects.set(id, created);
    return created;
  };

  for (const user of users) {
    for (const project of user.projects.administrator) {
      rowFor(project).administrators.push(user.username);
    }
    for (const project of user.projects.editor) {
      rowFor(project).editors.push(user.username);
    }
    for (const project of user.projects.observer) {
      rowFor(project).observers.push(user.username);
    }
  }
  return [...projects.values()];
};

/**
 * What the report's own read established. A confirmed refusal or absence is the report's answer, so
 * it replaces whatever was on screen; anything else could not refresh a readable report, which
 * stays readable and says so rather than disappearing.
 */
export type InventoryRead<TReport> =
  | { failure: TransportFailure; kind: "stale"; report: TReport }
  | { failure: TransportFailure; kind: "unavailable" }
  | { kind: "available"; report: TReport }
  | { kind: "pending" };

export const classifyInventoryRead = <TReport>({
  data,
  error,
  isError,
}: {
  data: TReport | undefined;
  error: unknown;
  isError: boolean;
}): InventoryRead<TReport> => {
  if (!isError) {
    return data === undefined ? { kind: "pending" } : { kind: "available", report: data };
  }
  const failure = classifyTransportFailure(error);
  return data !== undefined && !administrationReadIsAuthoritative(error)
    ? { failure, kind: "stale", report: data }
    : { failure, kind: "unavailable" };
};

/** Shapes a report without deciding anything about the read that answered with it. */
export const mapInventoryRead = <TReport, TShaped>(
  read: InventoryRead<TReport>,
  shape: (report: TReport) => TShaped,
): InventoryRead<TShaped> => {
  if (read.kind === "available") {
    return { kind: "available", report: shape(read.report) };
  }
  if (read.kind === "stale") {
    return { failure: read.failure, kind: "stale", report: shape(read.report) };
  }
  return read;
};
