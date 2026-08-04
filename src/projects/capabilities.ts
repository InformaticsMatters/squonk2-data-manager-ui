import { type UserAccountDetail } from "@/api/data-manager";

export type ProjectCapability =
  | { status: "disabled"; reason: string }
  | { status: "enabled"; reason?: string }
  | { status: "hidden" };

/** `stale` covers both unresolved and refetching generated facts; neither confirms authority. */
export type ProjectFactsFreshness = "current" | "stale";

export type ProjectCaller = { isPlatformAdministrator: boolean; username?: string };

export type ProjectRoles = {
  isAdministrator: boolean;
  isCreator: boolean;
  isEditor: boolean;
  isObserver: boolean;
};

/**
 * The concrete project resource each evaluator reads. Only the generated membership and creator
 * fields are consulted, so no capability depends on a name, a route, or a selected project.
 */
export type ProjectMembershipFacts = {
  administrators: string[];
  creator: string;
  editors: string[];
  observers: string[];
};

export type ProjectCapabilityFacts = {
  caller: ProjectCaller;
  freshness?: ProjectFactsFreshness;
  project: ProjectMembershipFacts;
  /**
   * Absent while the linked subscription has not answered. Spending actions cannot be established
   * as safe without it, so they say so explicitly rather than staying optimistically available.
   */
  subscription?: { atLimit: boolean };
};

/**
 * Facts that cannot yet confirm authority leave an ordinary action available, but they still say
 * what it requires, so a caller can tell what to expect before the server answers.
 */
const unconfirmed = (requirement: string): ProjectCapability => ({
  status: "enabled",
  reason: `${requirement} Your permission will be confirmed when you use this action.`,
});

/** Hidden capabilities never explain themselves; every other status may carry a reason. */
export const capabilityReason = (capability: ProjectCapability): string | undefined =>
  capability.status === "hidden" ? undefined : capability.reason;

export const resolveProjectRoles = (
  project: ProjectMembershipFacts,
  username: string | undefined,
): ProjectRoles => ({
  isAdministrator: username !== undefined && project.administrators.includes(username),
  isCreator: username !== undefined && project.creator === username,
  isEditor: username !== undefined && project.editors.includes(username),
  isObserver: username !== undefined && project.observers.includes(username),
});

/**
 * Platform privilege is a fact of the caller, not of the project. It is taken from the generated
 * Data Manager account resource, the Data Manager roles it reports, or the realm roles the caller
 * presented, so an unconfigured administrator role name can never turn ordinary roles into it.
 */
export const resolvePlatformAdministrator = (
  account: Pick<UserAccountDetail, "caller_has_admin_privilege" | "data_manager_roles"> | undefined,
  realmRoles: readonly string[] | undefined,
  administratorRole: string | undefined,
): boolean => {
  if (account?.caller_has_admin_privilege === true) {
    return true;
  }
  if (administratorRole === undefined || administratorRole === "") {
    return false;
  }
  return (
    (account?.data_manager_roles ?? []).includes(administratorRole) ||
    (realmRoles ?? []).includes(administratorRole)
  );
};

const factsAreConfirmed = ({ caller, freshness = "current" }: ProjectCapabilityFacts) =>
  freshness === "current" && !!caller.username;

const roles = (facts: ProjectCapabilityFacts) =>
  resolveProjectRoles(facts.project, facts.caller.username);

const administers = (facts: ProjectCapabilityFacts) =>
  facts.caller.isPlatformAdministrator || roles(facts).isAdministrator;

const edits = (facts: ProjectCapabilityFacts) => administers(facts) || roles(facts).isEditor;

/**
 * True only when the caller holds no mutation authority over the project at all. A caller whose
 * actions are merely blocked — by a coin limit, say — is not a read-only caller, and unconfirmed
 * facts never claim read-only access before the server has answered.
 */
export const projectIsReadOnly = (facts: ProjectCapabilityFacts): boolean =>
  factsAreConfirmed(facts) && !edits(facts);

/**
 * An ordinary administrator action never spends coins, so it depends on nothing but the caller's
 * authority over the concrete project resource.
 */
const evaluateAdministratorAction =
  (requirement: string) =>
  (facts: ProjectCapabilityFacts): ProjectCapability => {
    if (!factsAreConfirmed(facts)) {
      return unconfirmed(requirement);
    }
    return administers(facts) ? { status: "enabled" } : { status: "disabled", reason: requirement };
  };

/**
 * A spending action is only offered once its billing facts are known. Missing facts outrank both
 * the stale fallback and the caller's authority, because an action that cannot be established as
 * safe is explained rather than left available.
 */
const evaluateSpendingAction =
  ({
    limitReason,
    requirement,
    unsafeReason,
  }: {
    limitReason: string;
    requirement: string;
    unsafeReason: string;
  }) =>
  (facts: ProjectCapabilityFacts): ProjectCapability => {
    if (!facts.subscription) {
      return { status: "disabled", reason: unsafeReason };
    }
    if (!factsAreConfirmed(facts)) {
      return unconfirmed(requirement);
    }
    if (!edits(facts)) {
      return { status: "disabled", reason: requirement };
    }
    return facts.subscription.atLimit
      ? { status: "disabled", reason: limitReason }
      : { status: "enabled" };
  };

export const evaluateProjectPrivacyCapability = evaluateAdministratorAction(
  "You must be a project administrator to change project privacy.",
);

export const evaluateProjectAdministratorsCapability = evaluateAdministratorAction(
  "You must be a project administrator to change project administrators.",
);

export const evaluateProjectEditorsCapability = evaluateAdministratorAction(
  "You must be a project administrator to change project editors.",
);

export const evaluateProjectObserversCapability = evaluateAdministratorAction(
  "You must be a project administrator to change project observers.",
);

export const evaluateProjectDeletionCapability = evaluateAdministratorAction(
  "You must be a project administrator to delete this project.",
);

export const evaluateProjectFileMutationCapability = evaluateSpendingAction({
  limitReason: "This project's subscription is at its coin limit, so files cannot be changed.",
  requirement: "You must be a project editor or administrator to change project files.",
  unsafeReason:
    "This project's subscription could not be read, so file changes cannot be established as safe.",
});

export const evaluateProjectExecutionCapability = evaluateSpendingAction({
  limitReason: "This project's subscription is at its coin limit, so work cannot be run.",
  requirement: "You must be a project editor or administrator to run work in this project.",
  unsafeReason:
    "This project's subscription could not be read, so running work cannot be established as safe.",
});

const platformAdministrationRequirement =
  "Taking administration of a project you are not a member of requires the Data Manager administrator role.";

/**
 * Taking administration of a project the caller has no membership in is exclusively a platform
 * administrator's action, so it is the one project capability that hides itself. Facts that cannot
 * establish the role leave it hidden rather than advertising a privileged operation.
 */
export const evaluateProjectPlatformAdministrationCapability = (
  facts: ProjectCapabilityFacts,
): ProjectCapability => {
  if (!facts.caller.isPlatformAdministrator || !facts.caller.username) {
    return { status: "hidden" };
  }
  if (!factsAreConfirmed(facts)) {
    return unconfirmed(platformAdministrationRequirement);
  }
  return roles(facts).isAdministrator
    ? { status: "disabled", reason: "You already administer this project." }
    : { status: "enabled" };
};
