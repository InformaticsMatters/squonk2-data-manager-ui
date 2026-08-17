/**
 * The one shape a capability evaluator answers with, and the few predicates every family reads it
 * back through.
 *
 * This is deliberately not a permission engine and holds no rules: each family still owns its own
 * named, action-specific evaluators over its own generated resources. What is shared here is only
 * what all three families were already saying identically — the three statuses a control can be in,
 * how a reason is read off one, and the sentence that says authority is not yet established.
 */
export type Capability =
  | { status: "disabled"; reason: string }
  | { status: "enabled"; reason?: string }
  | { status: "hidden" };

/** Hidden capabilities never explain themselves; every other status may carry a reason. */
export const capabilityReason = (capability: Capability): string | undefined =>
  capability.status === "hidden" ? undefined : capability.reason;

/** A control is offered only by an enabled capability, so the two can never disagree. */
export const capabilityIsEnabled = (capability: Capability): boolean =>
  capability.status === "enabled";

/**
 * What an ordinary action says when the facts behind it cannot yet confirm authority. The action
 * stays available and names the server as the authority, because a client hint that withheld it
 * would be claiming an enforcement it does not perform.
 */
export const unconfirmedPermissionNotice =
  "Your permission will be confirmed when you use this action.";

/** An unconfirmed ordinary action that requires nothing further of the caller to state. */
export const unconfirmedCapability: Capability = {
  status: "enabled",
  reason: unconfirmedPermissionNotice,
};

/**
 * The facts every capability needs before it can claim to know anything: who is asking, and whether
 * what was read about them is current. Families widen `TFreshness` where they distinguish more than
 * a current read from a stale one; the predicate only ever asks whether the read was current.
 */
export type CapabilityFacts<TFreshness extends string = "current" | "stale"> = {
  caller: { username?: string };
  freshness?: TFreshness;
};

/**
 * Whether facts have established enough to speak for the caller's authority. An absent freshness is
 * a current read: only a family that says otherwise has anything to be stale about.
 */
export const capabilityFactsAreConfirmed = <TFreshness extends string>({
  caller,
  freshness,
}: CapabilityFacts<TFreshness>): boolean =>
  (freshness ?? "current") === "current" && !!caller.username;
