/**
 * The project membership lists Manage owns. Each is a list of usernames on the generated project
 * resource, so the same shaping rules apply to all three.
 */
export const projectRoles = ["administrator", "editor", "observer"] as const;

export type ProjectRole = (typeof projectRoles)[number];

/** "an administrator", "an editor", "an observer" — the article the role's own name takes. */
const withArticle = (role: ProjectRole) => `an ${role}`;

/** The plural the list itself is called by, e.g. "this project's editors". */
const listOf = (role: ProjectRole) => `this project's ${role}s`;

/**
 * One membership change, already shaped into what a command may send. `none` carries the reason
 * nothing was sent, so a control that changed nothing still says why.
 */
export type ProjectMemberChange =
  | { kind: "add"; role: ProjectRole; username: string }
  | { kind: "none"; reason: string }
  | { kind: "remove"; role: ProjectRole; username: string };

export type ProjectPrivacyChange =
  | { kind: "none"; reason: string }
  | { kind: "set"; isPrivate: boolean };

/**
 * What a project command did. Every command answers with one of these rather than with a message,
 * so what happened stays a fact and only its presentation is words.
 */
export type ProjectCommandOutcome =
  | { change: "added" | "removed"; kind: "membership"; role: ProjectRole; username: string }
  | { kind: "administration" }
  | { kind: "privacy"; isPrivate: boolean }
  | { kind: "unchanged"; reason: string };

/** A username is the name it spells; surrounding whitespace is never part of a user's identity. */
const shapeUsernames = (usernames: readonly string[]) => usernames.map((name) => name.trim());

/** Naming the same user more than once still names one user. */
const distinct = (usernames: readonly string[]) => [...new Set(usernames)];

/**
 * Resolves the one membership change a list edit expresses. A blank name is not a user, a name the
 * list already holds is not an addition, and an edit expressing more than one difference is never
 * guessed at, because the Data Manager takes one member at a time.
 */
export const resolveProjectMemberChange = (
  role: ProjectRole,
  current: readonly string[],
  next: readonly string[],
): ProjectMemberChange => {
  const held = distinct(shapeUsernames(current));
  // The list as typed, so a name entered twice can still be told apart from a name entered once.
  const requestedAsTyped = shapeUsernames(next);
  const requested = distinct(requestedAsTyped);
  const added = requested.filter((username) => !held.includes(username));
  const removed = held.filter((username) => !requested.includes(username));

  if (added.length + removed.length > 1) {
    return { kind: "none", reason: `Only one ${role} can be changed at a time.` };
  }
  if (added.length === 1) {
    return added[0] === ""
      ? { kind: "none", reason: `Enter a username to add as ${withArticle(role)}.` }
      : { kind: "add", role, username: added[0] };
  }
  if (removed.length === 1) {
    return { kind: "remove", role, username: removed[0] };
  }
  // Nothing differs, so every name the edit carries is one the project already records, and a name
  // it carries twice is a membership someone tried to add again. Naming that user is the more
  // useful of the two answers.
  const repeated = requestedAsTyped.find(
    (username, index) => username !== "" && requestedAsTyped.indexOf(username) !== index,
  );
  return repeated === undefined
    ? { kind: "none", reason: `Nothing about ${listOf(role)} was changed.` }
    : { kind: "none", reason: `${repeated} is already ${withArticle(role)} of this project.` };
};

/** Privacy the project already has is never sent, so a repeated toggle cannot look like a change. */
export const resolveProjectPrivacyChange = (
  current: boolean,
  next: boolean,
): ProjectPrivacyChange =>
  current === next
    ? { kind: "none", reason: `This project is already ${current ? "private" : "public"}.` }
    : { kind: "set", isPrivate: next };

export const projectOutcomeMessage = (outcome: ProjectCommandOutcome): string => {
  switch (outcome.kind) {
    case "administration":
      return "You now administer this project.";
    case "membership":
      return outcome.change === "added"
        ? `${outcome.username} is now ${withArticle(outcome.role)} of this project.`
        : `${outcome.username} is no longer ${withArticle(outcome.role)} of this project.`;
    case "privacy":
      return `This project is now ${outcome.isPrivate ? "private" : "public"}.`;
    case "unchanged":
      return outcome.reason;
  }
};
