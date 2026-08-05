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

/**
 * The state of the project's linked subscription. `accountsForInstances` is false for a linked
 * subscription that declares no instance accounting, so work run in the project could not be
 * charged for; `atLimit` is its own coin state.
 */
export type ProjectSubscriptionState = { accountsForInstances: boolean; atLimit: boolean };

export type ProjectCapabilityFacts = {
  caller: ProjectCaller;
  freshness?: ProjectFactsFreshness;
  project: ProjectMembershipFacts;
  /**
   * The project's linked subscription is resolved before the project mounts, so its state is always
   * a concrete fact here rather than something a spending action has to guess at.
   */
  subscription: ProjectSubscriptionState;
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

/**
 * Ordinary authority is a fact of the project's own membership lists alone. Platform privilege is
 * deliberately not folded in: a platform administrator who is not a member of a project holds no
 * ordinary authority over it until they take administration of it, which is the one action their
 * realm role does offer.
 */
const administers = (facts: ProjectCapabilityFacts) => roles(facts).isAdministrator;

const edits = (facts: ProjectCapabilityFacts) => {
  const held = roles(facts);
  return held.isAdministrator || held.isEditor;
};

/**
 * True only when the caller holds no mutation authority over the project at all. A caller whose
 * actions are merely blocked — by a coin limit, say — is not a read-only caller, and unconfirmed
 * facts never claim read-only access before the server has answered. A platform administrator who
 * holds no project role reads the project like any other viewer until they take administration.
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
 * A spending action is only offered once the linked subscription can account for it. A subscription
 * that cannot outranks the optimistic stale fallback, because an action that cannot be established
 * as safe is explained rather than left available; a confirmed lack of authority is still the more
 * useful explanation, so it is reported first, exactly as the coin limit is.
 */
const evaluateSpendingAction =
  ({
    limitReason,
    requirement,
    unaccountableReason,
  }: {
    limitReason: string;
    requirement: string;
    /**
     * Absent for an action every linked subscription accounts for. Present for an action that needs
     * instance accounting, which only a project-tier subscription declares.
     */
    unaccountableReason?: string;
  }) =>
  (facts: ProjectCapabilityFacts): ProjectCapability => {
    const unaccountable: ProjectCapability | undefined =
      unaccountableReason !== undefined && !facts.subscription.accountsForInstances
        ? { status: "disabled", reason: unaccountableReason }
        : undefined;

    if (!factsAreConfirmed(facts)) {
      return unaccountable ?? unconfirmed(requirement);
    }
    if (!edits(facts)) {
      return { status: "disabled", reason: requirement };
    }
    if (unaccountable) {
      return unaccountable;
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

/** Every linked subscription accounts for storage, so file changes need no instance accounting. */
export const evaluateProjectFileMutationCapability = evaluateSpendingAction({
  limitReason: "This project's subscription is at its coin limit, so files cannot be changed.",
  requirement: "You must be a project editor or administrator to change project files.",
});

export const evaluateProjectExecutionCapability = evaluateSpendingAction({
  limitReason: "This project's subscription is at its coin limit, so work cannot be run.",
  requirement: "You must be a project editor or administrator to run work in this project.",
  unaccountableReason:
    "This project's subscription does not account for instances, so running work cannot be established as safe.",
});

/**
 * Taking administration of a project the caller has no membership in is exclusively a platform
 * administrator's action, so it is the one project capability that hides itself. Facts that cannot
 * establish both the caller and the role leave it hidden rather than advertising a privileged
 * operation; the command names the caller, so an unresolved caller is as disqualifying as a
 * missing role.
 */
export const evaluateProjectPlatformAdministrationCapability = (
  facts: ProjectCapabilityFacts,
): ProjectCapability => {
  if (!facts.caller.isPlatformAdministrator || !factsAreConfirmed(facts)) {
    return { status: "hidden" };
  }
  return administers(facts)
    ? { status: "disabled", reason: "You already administer this project." }
    : { status: "enabled" };
};
