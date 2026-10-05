import { type ReactNode } from "react";

import { Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { capabilityIsEnabled, capabilityReason, type ProjectCapability } from "./capabilities";

/** One reason's line, empty and unannounced, holding its height. */
export const ReservedReasonLine = () => (
  <Typography aria-hidden sx={{ visibility: "hidden" }} variant="body2">
    {"\u00A0"}
  </Typography>
);

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
 *
 * `reserveReason` holds the reason's line where there is none, for a layout whose height must not
 * depend on whether the action is explained — one whose placeholder could not know.
 */
export const CapabilityButton = ({
  capability,
  children,
  href,
  id,
  isPending = false,
  onClick,
  reserveReason = false,
  startIcon,
  variant = "outlined",
}: {
  capability: ProjectCapability;
  children: string;
  href?: string;
  id: string;
  isPending?: boolean;
  onClick?: () => void;
  reserveReason?: boolean;
  startIcon?: ReactNode;
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
          startIcon={startIcon}
          sx={{ whiteSpace: "nowrap" }}
          variant={variant}
        >
          {children}
        </Button>
      ) : (
        <Button
          aria-describedby={reason ? `${id}-reason` : undefined}
          disabled={disabled}
          startIcon={startIcon}
          sx={{ whiteSpace: "nowrap" }}
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
      ) : reserveReason ? (
        <ReservedReasonLine />
      ) : null}
    </Stack>
  );
};
