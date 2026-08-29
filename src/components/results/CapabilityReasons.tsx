import { createContext, type ReactNode, useContext } from "react";

import { Typography } from "@mui/material";

import { capabilityReason, type ProjectCapability } from "../../projects/capabilities";

/** A stable empty list, so a surface that states nothing of its own never re-renders what it holds. */
const noReasons: readonly string[] = [];

/** Reasons the surrounding page has already stated, which no control below it repeats. */
const StatedReasonsContext = createContext<readonly string[]>(noReasons);

/**
 * States a set of reasons once, for everything rendered inside it. A page whose every control is
 * withheld for the same reason says so at the top and leaves its controls silent about it, rather
 * than printing one sentence per card for a fact that belongs to the page.
 *
 * Only the reasons given here are taken over: a control withheld for a reason of its own — stale
 * content, a foreign result, a coin limit — still states that reason where it is.
 */
export const ReasonsStatedAbove = ({
  children,
  reasons,
}: {
  children: ReactNode;
  reasons: readonly string[];
}) => <StatedReasonsContext value={reasons}>{children}</StatedReasonsContext>;

/**
 * Undoes that for a surface of its own. A dialog covers whatever the page said above it, so a
 * control inside one explains itself in full rather than deferring to a sentence the caller can no
 * longer read.
 */
export const ReasonsRestatedHere = ({ children }: { children: ReactNode }) => (
  <StatedReasonsContext value={noReasons}>{children}</StatedReasonsContext>
);

/**
 * States what the actions beside it require. A caller who cannot act on a result can always tell
 * an action they lack from an action that does not exist, an action that is merely unconfirmed
 * still says what it needs, and each reason is stated once however many actions share it.
 *
 * A requirement is a sentence rather than a control, so where it shares a row with controls it
 * takes a line of its own rather than competing with them for the width of a card.
 */
export const CapabilityReasons = ({ capabilities }: { capabilities: ProjectCapability[] }) => {
  const statedAbove = useContext(StatedReasonsContext);
  const reasons = [
    ...new Set(
      capabilities
        .map((capability) => capabilityReason(capability))
        .filter((reason): reason is string => !!reason && !statedAbove.includes(reason)),
    ),
  ];

  return reasons.length === 0 ? null : (
    <Typography color="text.secondary" sx={{ px: 1, flexBasis: "100%" }} variant="body2">
      {reasons.join(" ")}
    </Typography>
  );
};
