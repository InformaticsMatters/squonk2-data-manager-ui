import { type ReactNode } from "react";

import { IconButton, type IconButtonProps, Tooltip } from "@mui/material";

import { capabilityIsEnabled, capabilityReason, type ProjectCapability } from "./capabilities";

/**
 * One capability-governed action, offered only by an enabled capability. An unavailable action
 * stays visible and disabled, and its tooltip states the requirement its capability gave rather
 * than the action's own title, so a caller who cannot use it is told why without having to try it.
 * A disabled MUI control does not raise the pointer events a tooltip needs, so the wrapper carries
 * them instead.
 */
export const CapabilityIconButton = ({
  capability,
  children,
  isPending = false,
  title,
  ...buttonProps
}: Omit<IconButtonProps, "disabled" | "title"> & {
  capability: ProjectCapability;
  children: ReactNode;
  isPending?: boolean;
  title: string;
}) => {
  const reason = capabilityReason(capability);
  const enabled = capabilityIsEnabled(capability);

  return (
    <Tooltip title={enabled ? title : (reason ?? title)}>
      <span>
        <IconButton {...buttonProps} aria-label={title} disabled={!enabled || isPending}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
};
