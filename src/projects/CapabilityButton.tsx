import { Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { capabilityIsEnabled, capabilityReason, type ProjectCapability } from "./capabilities";

/**
 * One capability-governed action in the Projects family, with its reason beneath it. A hidden
 * capability renders nothing; every other status renders the control, disabled unless enabled —
 * the same presentation Administration gives a capability, written here because presentation is
 * the family's own and the rule behind it is what the two share.
 *
 * The reason is associated with the control rather than merely placed near it, so a caller who
 * cannot use the action hears why along with its name.
 *
 * An action that navigates passes `href` instead of `onClick`; a refused one is a plain disabled
 * button either way, because a link that cannot be followed is still a link.
 */
export const CapabilityButton = ({
  capability,
  children,
  href,
  id,
  isPending = false,
  onClick,
  variant = "outlined",
}: {
  capability: ProjectCapability;
  children: string;
  href?: string;
  id: string;
  isPending?: boolean;
  onClick?: () => void;
  variant?: "contained" | "outlined";
}) => {
  if (capability.status === "hidden") {
    return null;
  }
  const reason = capabilityReason(capability);
  const disabled = !capabilityIsEnabled(capability) || isPending;

  return (
    <Stack spacing={0.5} sx={{ alignItems: { sm: "flex-start" } }}>
      {href !== undefined && !disabled ? (
        <Button
          aria-describedby={reason ? `${id}-reason` : undefined}
          component={Link}
          href={href}
          variant={variant}
        >
          {children}
        </Button>
      ) : (
        <Button
          aria-describedby={reason ? `${id}-reason` : undefined}
          disabled={disabled}
          variant={variant}
          onClick={onClick}
        >
          {children}
        </Button>
      )}
      {reason ? (
        <Typography color="text.secondary" id={`${id}-reason`} variant="body2">
          {reason}
        </Typography>
      ) : null}
    </Stack>
  );
};
