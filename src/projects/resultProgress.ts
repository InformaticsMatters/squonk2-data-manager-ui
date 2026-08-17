import { isTransientTransportFailure } from "../api/runtime/classifyTransportFailure";

/**
 * How often a result that is still working is asked about again, and how far a failed read backs
 * off. Both are properties of asking the Data Manager rather than of any one kind of result, so
 * every Results poll keeps the same cadence and none of them can drift from another.
 */
export const pendingPollIntervalMs = 5000;
export const unconfirmedPollIntervalMs = 15_000;

/**
 * What a progress read that did not answer says about the result it was made for.
 *
 * `unconfirmed` failed transiently: the result is still working and still worth asking about, so
 * the poll backs off rather than stopping. `unknown` is a read this client cannot interpret or is
 * not allowed to make, so it stops asking instead of guessing an outcome. Neither is ever a result
 * that finished.
 */
export type ResultProgressReadFailure =
  | { kind: "unconfirmed"; reason: string }
  | { kind: "unknown"; reason: string };

/** The result kinds that account for their own progress, in the words each of them is described by. */
export type ResultProgressSubject = "instance" | "task" | "workflow";

/**
 * What is said about progress this client cannot establish at all. It is stated here as well as
 * raised by a failed read, because a result can also describe itself in terms this client has no
 * rule for, which establishes exactly as little.
 */
export const progressUnknownReason = (subject: ResultProgressSubject) =>
  `This ${subject}'s progress could not be established. Retry to check it again.`;

/** A read that may answer next time keeps the result working; anything else stops the poll. */
export const classifyProgressReadFailure = (
  error: unknown,
  subject: ResultProgressSubject,
): ResultProgressReadFailure =>
  isTransientTransportFailure(error)
    ? {
        kind: "unconfirmed",
        reason: `This ${subject}'s progress could not be read. It is still being checked.`,
      }
    : { kind: "unknown", reason: progressUnknownReason(subject) };

/**
 * Whether a result has accounted for itself. Only a result that finished is settled; one still
 * working is pending; and progress that could not be read at all establishes nothing, which is a
 * different thing from a result known to be working.
 */
export type ResultSettlement = "pending" | "settled" | "unestablished";
