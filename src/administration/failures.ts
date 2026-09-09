import {
  classifyTransportFailure,
  type TransportFailure,
} from "../api/runtime/classifyTransportFailure";
import { apiFailureSentence } from "../utils/next/orvalError";

export type AdministrationFailurePresentation = {
  message: string;
  retryable: boolean;
  severity: "error" | "warning";
};

export const presentAdministrationFailure = (
  failure: TransportFailure,
): AdministrationFailurePresentation => {
  const said = apiFailureSentence(failure.cause);
  switch (failure.kind) {
    case "forbidden":
      return {
        message: said ?? "You do not have access to this Administration resource.",
        retryable: false,
        severity: "warning",
      };
    // A refused token is a fact about the credential presented rather than about the resource
    // addressed, and its own words are a list of scopes written for whoever holds the client
    // registration. They are not relayed; the refusal is stated as it always was.
    case "token-refused":
      return {
        message: "You do not have access to this Administration resource.",
        retryable: false,
        severity: "warning",
      };
    case "not-found":
      return {
        message: said ?? "This Administration resource is no longer available.",
        retryable: false,
        severity: "warning",
      };
    case "rate-limited":
      return {
        message: "Administration requests are temporarily rate-limited. Retry this task.",
        retryable: true,
        severity: "error",
      };
    case "timeout":
      return {
        message: "The Administration request timed out. Retry this task.",
        retryable: true,
        severity: "error",
      };
    case "network":
      return {
        message: "Administration data could not be reached. Check your connection and retry.",
        retryable: true,
        severity: "error",
      };
    case "server":
      return {
        message: "The Administration service failed to respond. Retry this task.",
        retryable: true,
        severity: "error",
      };
    // Every one of these is the service refusing the request it was sent, so the same request can
    // never succeed and no Retry is offered for it. They were shown as data that could not be
    // loaded, with a Retry, while the transport had no kind for them.
    case "bad-request":
    case "conflict":
    case "method-not-allowed":
    case "unprocessable":
    case "unsupported-media-type":
      return {
        message: said ?? "This Administration request was refused.",
        retryable: false,
        severity: "warning",
      };
    // A fact this client cannot classify is not known to be a refusal, so the read is still worth
    // making again rather than being believed.
    case "unknown":
      return {
        message: "Administration data could not be loaded. Retry this task.",
        retryable: true,
        severity: "error",
      };
  }
};

/**
 * An authoritative read failure is answered by the addressed resource itself, so the task, its
 * navigation, and the canonical route survive. Every retryable failure stays with the task-level
 * retry boundary instead.
 */
export const administrationReadIsAuthoritative = (error: unknown): boolean =>
  !presentAdministrationFailure(classifyTransportFailure(error)).retryable;

/**
 * Which resource a refused Administration read was about. The answer differs by subject, so the
 * subject is named rather than inferred from the failure.
 */
export type AdministrationReadSubject = "organisation" | "subscription" | "unit";

/**
 * What a failed Administration read costs the screen.
 *
 * `retry` is every transport fact the resource did not answer for itself; it keeps the section
 * frame and its Retry, so recovering never costs the caller their place.
 *
 * The two authoritative answers differ by subject, and deliberately. A refused **organisation**
 * read `degrade`s: the overview is that organisation's page, but its unit list, its create actions
 * and the workspace around it do not depend on reading the organisation itself, so a permission the
 * caller does not have takes away the members and privacy sections and nothing else. This is what
 * keeps the default organisation — which refuses its own detail read to every ordinary caller —
 * from replacing the one page a new user has to reach to create their first unit.
 *
 * A refused **unit** or **subscription** read `replace`s, because a resource the caller cannot read
 * genuinely has no content to put around a degraded section.
 */
export const decideAdministrationReadFailure = (
  subject: AdministrationReadSubject,
  failure: TransportFailure,
): "degrade" | "replace" | "retry" => {
  if (presentAdministrationFailure(failure).retryable) {
    return "retry";
  }
  return subject === "organisation" ? "degrade" : "replace";
};

/** Names an Administration resource in command feedback without disclosing anything beyond its ID. */
export const administrationResourceLabel = {
  newOrganisation: "an organisation",
  organisation: (organisationId: string) => `organisation ${organisationId}`,
  personalUnit: "your personal unit",
  subscription: (productId: string) => `subscription ${productId}`,
  unit: (unitId: string) => `unit ${unitId}`,
};

/** What every Administration command failure guarantees about the screen behind it. */
const resourceUnchanged = "The displayed resource has not changed";

/**
 * A rejected command as the service accounted for it, followed by the guarantee only this client can
 * give. `undefined` where the service gave no account, which is where each caller's own wording
 * stands in.
 */
const statedRejection = (error: unknown): string | undefined => {
  const said = apiFailureSentence(error);
  return said === undefined ? undefined : `${said} ${resourceUnchanged}.`;
};

/**
 * Presents an authoritative rejection of an Administration command.
 *
 * The service's own account of the refusal comes first, because a `403` from these services is
 * routinely a rule about the resource rather than a permission the caller lost — removing a member
 * the Account Server does not know answers `Unknown User`, and removing one from the default
 * organisation answers `Users cannot be removed from this Organisation`. Reporting either as lost
 * permission sends the caller looking for an access problem that is not there. This client's own
 * guarantee follows it, because that is the one thing the service cannot say: the displayed
 * resource and its canonical route are never changed by a rejection.
 *
 * A rejection that accounted for itself with nothing keeps the canned wording, and an unclassified
 * failure still returns `undefined` so the shared error presentation stays in charge.
 */
export const administrationMutationFailureMessage = (
  error: unknown,
  action: string,
  resource: string,
): string | undefined => {
  const stated = statedRejection(error);
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
      return (
        stated ?? `You no longer have permission to ${action} ${resource}. ${resourceUnchanged}.`
      );
    // A token refusal answers with a list of scopes rather than with anything about this command,
    // so it is stated as the refusal it was stated as before it had a kind of its own.
    case "token-refused":
      return `You no longer have permission to ${action} ${resource}. ${resourceUnchanged}.`;
    case "not-found":
      return stated ?? `${resource} is no longer available. ${resourceUnchanged}.`;
    // A transport fact says nothing about the command, so the service has no account of it to
    // relay and the sentence is this client's alone.
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return `Could not ${action} ${resource}. ${resourceUnchanged}; retry is available.`;
    // The service refused the request it was sent, so it is reported as a refusal even where it
    // accounted for itself with nothing: the shared error presentation would state the reason phrase
    // — "Bad Request" — to a person, and would not say what became of what is on screen.
    case "bad-request":
    case "conflict":
    case "method-not-allowed":
    case "unprocessable":
    case "unsupported-media-type":
      return stated ?? `Could not ${action} ${resource}. ${resourceUnchanged}.`;
    // A fact this client cannot classify is not known to be a refusal, and nothing is claimed about
    // it here; the shared error presentation stays in charge of it.
    case "unknown":
      return undefined;
  }
};

/**
 * Presents a refused unit deletion. Delete is offered only to a caller the client has already
 * confirmed may take it, and the Account Server refuses to delete a unit that still holds products,
 * so a rejection is a precondition the unit carries rather than a permission the caller lost. Where
 * the Account Server named that precondition itself its words are relayed; where it named nothing,
 * the client says what the precondition usually is, rather than the generic "permission" wording
 * that sent the owner of a still-populated personal unit looking for an access problem that was not
 * there.
 */
export const unitDeletionFailureMessage = (error: unknown, resource: string): string => {
  const stated = statedRejection(error);
  switch (classifyTransportFailure(error).kind) {
    case "not-found":
      return stated ?? `${resource} is no longer available. ${resourceUnchanged}.`;
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return `Could not delete ${resource}. ${resourceUnchanged}; retry is available.`;
    case "bad-request":
    case "conflict":
    case "forbidden":
    case "method-not-allowed":
    case "token-refused":
    case "unknown":
    case "unprocessable":
    case "unsupported-media-type":
      return (
        stated ??
        `Could not delete ${resource}. It may still contain projects, datasets or subscriptions that must be removed first.`
      );
  }
};
