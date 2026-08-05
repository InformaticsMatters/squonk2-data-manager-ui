import { Typography } from "@mui/material";

import { capabilityReason, type ProjectCapability } from "../../projects/capabilities";

/**
 * States what the actions beside it require. A caller who cannot act on a result can always tell
 * an action they lack from an action that does not exist, an action that is merely unconfirmed
 * still says what it needs, and each reason is stated once however many actions share it.
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
    <Typography color="text.secondary" sx={{ px: 1 }} variant="body2">
      {reasons.join(" ")}
    </Typography>
  );
};
