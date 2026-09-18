import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";

/**
 * What a project section may show for one read it made. A confirmed refusal or absence clears the
 * content, because loaded content must not remain visible once access to it is known to be gone.
 * A session that lapsed keeps it, because nothing has been said about access at all. Everything
 * else — including an unclassifiable failure — is treated as recoverable, so a transient outage
 * marks its content stale and offers retry rather than claiming access was lost.
 */
export type SectionReadState =
  | { kind: "available" }
  | { kind: "recoverable"; retryable: true }
  | { kind: "session-lapsed" }
  | { kind: "unavailable" };

/**
 * One read answers for itself, whether it returned a collection or one addressed resource: a
 * refusal and an absence are the same non-disclosing outcome, and anything else is retried rather
 * than believed. Results and Run share this because the generated collections they read fail in
 * exactly the same ways; neither section shares how it presents the outcome.
 */
export const resolveSectionReadState = (error: unknown): SectionReadState => {
  if (error === null || error === undefined) {
    return { kind: "available" };
  }
  const kind = classifyTransportFailure(error).kind;
  // A refused token is the credential the read carried rather than the content it addressed, so it
  // clears nothing: a caller whose session lapsed has lost no access, and signing in again must
  // find their content where they left it.
  if (kind === "token-refused") {
    return { kind: "session-lapsed" };
  }
  return kind === "forbidden" || kind === "not-found"
    ? { kind: "unavailable" }
    : { kind: "recoverable", retryable: true };
};

/**
 * The failure one generated query is reporting. A query with nothing to show reports it as
 * `error`, but a query whose *refresh* failed keeps the data it already had and reports the
 * failure as `failureReason` instead. Stale content only exists in the second case, so a section
 * that must notice it has to read both.
 */
export const sectionReadFailure = (query: { error: unknown; failureReason: unknown }): unknown =>
  query.error ?? query.failureReason;

/**
 * Content that could not be refreshed is stale. Stale content is still worth reading, so it stays
 * on screen and says so, but nothing it describes can be established as safe to change. A lapsed
 * session is one such refresh: the content is intact and untouched, and it is equally out of date.
 */
export const resolveSectionFreshness = (readState: SectionReadState) =>
  readState.kind === "recoverable" || readState.kind === "session-lapsed"
    ? ("stale" as const)
    : ("current" as const);

/**
 * Each read's content is only as fresh as that read, so content that answered is never locked
 * because a different read failed.
 */
export const resolveSectionFreshnessByKey = <TKey extends string>(
  states: Record<TKey, SectionReadState>,
): Record<TKey, "current" | "stale"> =>
  Object.fromEntries(
    Object.entries<SectionReadState>(states).map(([key, state]) => [
      key,
      resolveSectionFreshness(state),
    ]),
  ) as Record<TKey, "current" | "stale">;

/** What a section must tell the caller about a group of reads it made together. */
export type SectionReadReport = {
  /** Any read could not be refreshed, so a retry is offered for it. */
  retryable: boolean;
  /** Any read was refused the token it carried, so re-authentication is offered for it. */
  sessionLapsed: boolean;
  /** Any read's content was cleared by a confirmed refusal or absence. */
  unavailable: boolean;
};

/**
 * A refusal, a lapsed session and a transient failure can happen in the same render and have
 * different consequences — one read's content is gone, another's is intact but out of date, a
 * third's is merely stale and worth retrying — so each is reported on its own. Aggregating them
 * into a single worst state would let a refused read silence the retry the transient one needs, or
 * offer a retry in place of the sign-in that is the only thing a refused token can be answered by.
 */
export const resolveSectionReadReport = (
  states: readonly SectionReadState[],
): SectionReadReport => ({
  retryable: states.some((state) => state.kind === "recoverable"),
  sessionLapsed: states.some((state) => state.kind === "session-lapsed"),
  unavailable: states.some((state) => state.kind === "unavailable"),
});

/** Content the caller is known to have lost access to is not shown, however recently it loaded. */
export const readableContent = <TItem>(
  state: SectionReadState,
  data: TItem[] | undefined,
): TItem[] => (state.kind === "unavailable" ? [] : (data ?? []));
