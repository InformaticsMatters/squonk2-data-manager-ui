import {
  type Capability,
  capabilityFactsAreConfirmed as factsAreConfirmed,
  unconfirmedPermissionNotice,
} from "../application/capability";
import { type ProjectFileContent } from "./fileFacts";
import { type ResultInstanceSettlement } from "./instanceFacts";
import { type ResultTaskSettlement } from "./taskFacts";
import { type ResultWorkflowSettlement } from "./workflowFacts";

/** Projects answer in the shared capability shape; the rules below are the family's own. */
export type ProjectCapability = Capability;

export { capabilityIsEnabled, capabilityReason } from "../application/capability";

/** `stale` covers both unresolved and refetching generated facts; neither confirms authority. */
export type ProjectFactsFreshness = "current" | "stale";

export type ProjectCaller = { username?: string };

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
  reason: `${requirement} ${unconfirmedPermissionNotice}`,
});

export const resolveProjectRoles = (
  project: ProjectMembershipFacts,
  username: string | undefined,
): ProjectRoles => ({
  isAdministrator: username !== undefined && project.administrators.includes(username),
  isCreator: username !== undefined && project.creator === username,
  isEditor: username !== undefined && project.editors.includes(username),
  isObserver: username !== undefined && project.observers.includes(username),
});

const roles = (facts: ProjectCapabilityFacts) =>
  resolveProjectRoles(facts.project, facts.caller.username);

/**
 * Ordinary authority is a fact of the project's own membership lists alone. Platform privilege is
 * deliberately not folded in: a platform administrator who is not a member of a project holds no
 * ordinary authority over it until a project administrator adds them to it.
 */
const administers = (facts: ProjectCapabilityFacts) => roles(facts).isAdministrator;

/**
 * Whether a caller may change a project at all: its administrator or its editor, never its creator
 * alone and never a platform administrator who holds no role in it. This is the one definition of
 * "a project I can write to", so the projects index, the onboarding decision, dataset attachment
 * and every editor capability below cannot disagree about which projects a caller can work in.
 */
export const callerEditsProject = (
  project: ProjectMembershipFacts,
  username: string | undefined,
): boolean => {
  const held = resolveProjectRoles(project, username);
  return held.isAdministrator || held.isEditor;
};

const edits = (facts: ProjectCapabilityFacts) =>
  callerEditsProject(facts.project, facts.caller.username);

/**
 * True only when the caller holds no mutation authority over the project at all. A caller whose
 * actions are merely blocked — by a coin limit, say — is not a read-only caller, and unconfirmed
 * facts never claim read-only access before the server has answered. A platform administrator who
 * holds no project role reads the project like any other viewer.
 */
export const projectIsReadOnly = (facts: ProjectCapabilityFacts): boolean =>
  factsAreConfirmed(facts) && !edits(facts);

/**
 * An ordinary editor action never spends coins, so a coin limit does not withhold it: stopping,
 * deleting, or archiving work a project already paid for stays available to anyone who may change
 * the project.
 */
const evaluateEditorAction =
  (requirement: string) =>
  (facts: ProjectCapabilityFacts): ProjectCapability => {
    if (!factsAreConfirmed(facts)) {
      return unconfirmed(requirement);
    }
    return edits(facts) ? { status: "enabled" } : { status: "disabled", reason: requirement };
  };

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
const evaluateFileSpend = evaluateSpendingAction({
  limitReason: "This project's subscription is at its coin limit, so files cannot be changed.",
  requirement: "You must be a project editor or administrator to change project files.",
});

/**
 * What a file action reads in addition to the project's own facts: whether the directory listing it
 * is acting on could last be established. No file action reads a selected or current project, and
 * none reads a path other than the one Files itself is displaying.
 */
export type ProjectFileFacts = ProjectCapabilityFacts & { content?: ProjectFileContent };

const unsafeDirectoryReasons: Record<Exclude<ProjectFileContent, "current">, string> = {
  stale:
    "This directory could not be refreshed, so changing its contents cannot be established as safe.",
  unavailable:
    "This directory is unavailable, so changing its contents cannot be established as safe.",
  unestablished:
    "This directory has not loaded yet, so changing its contents cannot be established as safe.",
};

/**
 * Changing files of the project in the URL. A confirmed lack of authority is the most useful
 * explanation, so it is reported first; a listing that could not be established then disables the
 * change rather than leaving it offered, because a directory the caller cannot see the current
 * state of is one they cannot safely add to, delete from, rename in, or overwrite.
 */
export const evaluateProjectFileMutationCapability = (
  facts: ProjectFileFacts,
): ProjectCapability => {
  const capability = evaluateFileSpend(facts);
  if (capability.status === "disabled" || facts.content === undefined) {
    return capability;
  }
  const unsafe = facts.content === "current" ? undefined : unsafeDirectoryReasons[facts.content];
  return unsafe === undefined ? capability : { status: "disabled", reason: unsafe };
};

export const evaluateProjectExecutionCapability = evaluateSpendingAction({
  limitReason: "This project's subscription is at its coin limit, so work cannot be run.",
  requirement: "You must be a project editor or administrator to run work in this project.",
  unaccountableReason:
    "This project's subscription does not account for instances, so running work cannot be established as safe.",
});

/**
 * What launching a definition reads in addition to the project's own facts: whether the catalogue
 * content describing that definition could last be established, and whether the definition itself
 * declares it cannot be run. Neither is a fact of any project other than the one in the URL.
 */
export type ProjectRunFacts = ProjectCapabilityFacts & {
  /** `stale` for catalogue content a failed refresh left on screen. */
  content?: "current" | "stale";
  /** The definition's own reason for being unrunnable, as the Data Manager gave it. */
  definitionUnavailability?: string;
};

const staleDefinitionReason =
  "This definition could not be refreshed, so running it cannot be established as safe.";

/**
 * Running one definition in the project in the URL. A confirmed lack of authority is the most
 * useful explanation, so it is reported first; a definition the Data Manager itself disabled is
 * reported next, because no authority overrides it; and catalogue content that merely could not be
 * refreshed disables the launch rather than leaving it offered.
 */
export const evaluateRunLaunchCapability = (facts: ProjectRunFacts): ProjectCapability => {
  const capability = evaluateProjectExecutionCapability(facts);
  if (capability.status === "disabled") {
    return capability;
  }
  if (facts.definitionUnavailability !== undefined) {
    return { status: "disabled", reason: facts.definitionUnavailability };
  }
  return facts.content === "stale"
    ? { status: "disabled", reason: staleDefinitionReason }
    : capability;
};

/**
 * What a result action reads in addition to the project's own facts: which project the result
 * itself belongs to, which project the URL addresses, and whether the displayed result content
 * could last be established. No result action reads a selected or current project.
 */
export type ProjectResultFacts = ProjectCapabilityFacts & {
  /** `stale` for content a failed refresh left on screen. */
  content?: "current" | "stale";
  owningProjectId: string;
  routeProjectId: string;
};

const foreignResultReason =
  "This result belongs to another project, so it cannot be changed from this project.";

const staleResultReason =
  "This result could not be refreshed, so changing it cannot be established as safe.";

/**
 * Wraps one project action as a result action. A result the addressed project does not own is
 * never actionable here, whatever authority the caller holds over the project in the URL. A
 * confirmed lack of authority is still the more useful explanation than stale content, so it is
 * reported first, and anything that merely could not be refreshed is disabled rather than offered.
 */
const evaluateResultAction =
  (evaluate: (facts: ProjectCapabilityFacts) => ProjectCapability) =>
  (facts: ProjectResultFacts): ProjectCapability => {
    if (facts.owningProjectId !== facts.routeProjectId) {
      return { status: "disabled", reason: foreignResultReason };
    }
    const capability = evaluate(facts);
    if (capability.status === "disabled" || facts.content !== "stale") {
      return capability;
    }
    return { status: "disabled", reason: staleResultReason };
  };

const evaluateTerminationAuthority = evaluateResultAction(
  evaluateEditorAction(
    "You must be a project editor or administrator to stop or delete instances in this project.",
  ),
);

/**
 * What stopping or deleting an instance reads in addition to the project's own facts: whether the
 * concrete instance has accounted for its own progress, which `instanceFacts.ts` is the only place
 * to decide. The Data Manager takes one request for an instance, but stopping work that is still
 * running and destroying a finished result are different things, so an instance this client cannot
 * account for is one it cannot say which of them the caller would be asking for.
 */
export type ProjectResultInstanceFacts = ProjectResultFacts & {
  settlement?: ResultInstanceSettlement;
};

const unestablishedInstanceReason =
  "This instance's progress could not be established, so stopping or deleting it cannot be established as safe.";

/**
 * Stopping or deleting one instance of the project in the URL. Ownership and a confirmed lack of
 * authority remain the more useful explanations, so they are reported first; an instance whose
 * progress established nothing then withholds the request rather than offering an irreversible one
 * whose effect this client cannot name.
 */
export const evaluateResultTerminationCapability = (
  facts: ProjectResultInstanceFacts,
): ProjectCapability => {
  const capability = evaluateTerminationAuthority(facts);
  return capability.status === "disabled" || facts.settlement !== "unestablished"
    ? capability
    : { status: "disabled", reason: unestablishedInstanceReason };
};

export const evaluateResultArchiveCapability = evaluateResultAction(
  evaluateEditorAction(
    "You must be a project editor or administrator to archive instances in this project.",
  ),
);

const evaluateTaskDeletionAuthority = evaluateResultAction(
  evaluateEditorAction(
    "You must be a project editor or administrator to delete tasks in this project.",
  ),
);

/**
 * What deleting a task reads in addition to the project's own facts: whether the concrete task has
 * accounted for being done, which `taskFacts.ts` is the only place to decide. The Data Manager will
 * not delete a task until it is done, so this is a fact of the addressed task rather than of any
 * project or selection.
 */
export type ProjectResultTaskFacts = ProjectResultFacts & { settlement?: ResultTaskSettlement };

const unsettledTaskReasons: Record<Exclude<ResultTaskSettlement, "settled">, string> = {
  pending: "This task is still running, so it cannot be deleted until it is done.",
  unestablished:
    "This task's progress could not be established, so deleting it cannot be established as safe.",
};

/**
 * Deleting one task of the project in the URL. Ownership and a confirmed lack of authority remain
 * the more useful explanations, so they are reported first; a task that has not finished then
 * disables the delete rather than leaving a request the Data Manager can only refuse.
 */
export const evaluateResultTaskDeletionCapability = (
  facts: ProjectResultTaskFacts,
): ProjectCapability => {
  const capability = evaluateTaskDeletionAuthority(facts);
  if (
    capability.status === "disabled" ||
    facts.settlement === undefined ||
    facts.settlement === "settled"
  ) {
    return capability;
  }
  return { status: "disabled", reason: unsettledTaskReasons[facts.settlement] };
};

const evaluateWorkflowLifecycleAuthority = evaluateResultAction(
  evaluateEditorAction(
    "You must be a project editor or administrator to stop or delete workflows in this project.",
  ),
);

/**
 * What stopping or deleting a workflow reads in addition to the project's own facts: whether the
 * concrete workflow has accounted for its own progress, which `workflowFacts.ts` is the only place
 * to decide. The Data Manager stops a running workflow and deletes a finished one, so a workflow
 * this client cannot account for is one it cannot tell those two requests apart for.
 */
export type ProjectResultWorkflowFacts = ProjectResultFacts & {
  settlement?: ResultWorkflowSettlement;
};

const unestablishedWorkflowReason =
  "This workflow's progress could not be established, so stopping or deleting it cannot be established as safe.";

/**
 * Stopping or deleting one workflow of the project in the URL. Ownership and a confirmed lack of
 * authority remain the more useful explanations, so they are reported first; a workflow whose
 * progress established nothing then withholds both requests rather than sending whichever one this
 * client guessed at.
 */
export const evaluateResultWorkflowLifecycleCapability = (
  facts: ProjectResultWorkflowFacts,
): ProjectCapability => {
  const capability = evaluateWorkflowLifecycleAuthority(facts);
  return capability.status === "disabled" || facts.settlement !== "unestablished"
    ? capability
    : { status: "disabled", reason: unestablishedWorkflowReason };
};

/** Running work again spends coins in the owning project, so it answers to its subscription too. */
export const evaluateResultRerunCapability = evaluateResultAction(
  evaluateSpendingAction({
    limitReason: "This project's subscription is at its coin limit, so work cannot be run.",
    requirement: "You must be a project editor or administrator to run work in this project.",
    unaccountableReason:
      "This project's subscription does not account for instances, so running work cannot be established as safe.",
  }),
);
