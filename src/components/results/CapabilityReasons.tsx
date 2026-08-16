import { Typography } from "@mui/material";

import { capabilityReason, type ProjectCapability } from "../../projects/capabilities";

/**
 * States what the actions beside it require. A caller who cannot act on a result can always tell
 * an action they lack from an action that does not exist, an action that is merely unconfirmed
 * still says what it needs, and each reason is stated once however many actions share it.
 *
 * A requirement is a sentence rather than a control, so where it shares a row with controls it
 * takes a line of its own rather than competing with them for the width of a card.
 */
export const CapabilityReasons = ({ capabilities }: { capabilities: ProjectCapability[] }) => {
  const reasons = [
    ...new Set(
      capabilities
        .map((capability) => capabilityReason(capability))
        .filter((reason): reason is string => !!reason),
    ),
  ];

  return reasons.length === 0 ? null : (
    <Typography color="text.secondary" sx={{ px: 1, flexBasis: "100%" }} variant="body2">
      {reasons.join(" ")}
    </Typography>
  );
};
