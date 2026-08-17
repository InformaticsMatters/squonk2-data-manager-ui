import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { upstreamFailureReason } from "./failures";

/**
 * What one launch of one definition has done so far. Launching is the one Run command whose success
 * navigates, so the attempt has to say whether the definition may be sent again before the Data
 * Manager has answered at all: the service creates an execution for every request it accepts, so a
 * launch already in flight, one it accepted, and one an authoritative answer refused are each
 * states no second submission may leave.
 */
export type LaunchAttempt =
  | { kind: "accepted" }
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "recoverable"; reason: string }
  | { kind: "rejected"; reason: string };

/** What can happen to one launch: it is sent, and the Data Manager answers it one way or another. */
export type LaunchEvent =
  | { kind: "accepted" }
  | { kind: "failed"; error: unknown }
  | { kind: "send" };

/** A definition nobody has launched yet, which is where every attempt starts. */
export const idleLaunch: LaunchAttempt = { kind: "idle" };

const pendingMessage =
  "This launch has been sent. It cannot be sent again until the Data Manager answers it.";

const acceptedMessage = "This launch was accepted. Opening the execution it created.";

const rejectedReason =
  "The Data Manager did not allow this to be run in this project. Nothing was launched, and the displayed project and its catalogue have not changed.";

const recoverableReason =
  "This launch could not be completed, so nothing was launched. The definition and everything entered have been kept, so it can be sent again.";

const unaccountedReason =
  "This launch was not completed, so nothing was launched. Correct it and send it again.";

/**
 * Classifies a launch the Data Manager did not accept. The service is the authorization authority,
 * so a refusal is authoritative feedback about this one launch: it withholds the launch without
 * touching the displayed project, the catalogue beneath the definition, or the canonical route. A
 * refusal and an identity the service will not acknowledge read alike, so comparing the two can
 * never reveal whether a definition the caller may not run exists.
 *
 * Everything else establishes nothing about authority and is therefore recoverable, including a
 * domain refusal of what was entered: correcting the form and sending it again is the caller's next
 * step, so the service's own account of what it would not accept is the sentence.
 */
export const classifyLaunchFailure = (
  error: unknown,
): Extract<LaunchAttempt, { kind: "recoverable" | "rejected" }> => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
    case "not-found":
      return { kind: "rejected", reason: rejectedReason };
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return { kind: "recoverable", reason: recoverableReason };
    // Every kind is named rather than defaulted, so a new transport fact has to be answered here
    // instead of quietly arriving as the service's own words.
    case "unknown":
      return { kind: "recoverable", reason: upstreamFailureReason(error) ?? unaccountedReason };
  }
};

/**
 * How one launch advances. An attempt that may not take the event is returned exactly as it was, so
 * a second submission of work already sent is refused here rather than by whichever control
 * happened to be used, and an answer to an attempt that already resolved can neither reopen it nor
 * overwrite what the caller was last told.
 */
export const transitionLaunch = (attempt: LaunchAttempt, event: LaunchEvent): LaunchAttempt => {
  switch (event.kind) {
    case "accepted":
      return attempt.kind === "pending" ? { kind: "accepted" } : attempt;
    case "failed":
      return attempt.kind === "pending" ? classifyLaunchFailure(event.error) : attempt;
    case "send":
      return attempt.kind === "idle" || attempt.kind === "recoverable"
        ? { kind: "pending" }
        : attempt;
  }
};

/**
 * Whether this attempt may still be sent. The control that offers a launch and the guard that
 * refuses a duplicate one both ask this, so the two can never disagree about a second submission.
 */
export const launchIsSendable = (attempt: LaunchAttempt): boolean =>
  transitionLaunch(attempt, { kind: "send" }) !== attempt;

/** The whole sentence a launch is presented with, so no screen writes one of its own. */
export type LaunchStatement = {
  message: string;
  severity: "error" | "info" | "success" | "warning";
};

/**
 * Where one launch stands, in the caller's own words. Every state but the untouched one says
 * something, because a launch that is in flight, one that was accepted, and one that was refused
 * are each the reason the control beside them is not offering to send anything.
 */
export const launchStatement = (attempt: LaunchAttempt): LaunchStatement | undefined => {
  switch (attempt.kind) {
    case "accepted":
      return { message: acceptedMessage, severity: "success" };
    case "idle":
      return undefined;
    case "pending":
      return { message: pendingMessage, severity: "info" };
    case "recoverable":
      return { message: attempt.reason, severity: "error" };
    case "rejected":
      return { message: attempt.reason, severity: "warning" };
  }
};
