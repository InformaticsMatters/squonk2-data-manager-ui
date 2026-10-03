import { type ReactNode } from "react";

import { Box, ListItem, ListItemText } from "@mui/material";

import { DurationIcon, TimeIcon } from "../../icons";

export interface ResponsiveListItemProps {
  primary: string;
  secondary?: string;
}

const withIcon = (icon: ReactNode, text: string) => (
  <Box component="span" sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
    {icon}
    {text}
  </Box>
);

/** When a result started (primary) and how long it ran (secondary). */
export const ResponsiveListItem = ({ primary, secondary }: ResponsiveListItemProps) => {
  return (
    <ListItem sx={{ ml: { xs: undefined, md: "auto" } }}>
      <ListItemText
        primary={withIcon(<TimeIcon fontSize="inherit" />, primary)}
        secondary={
          secondary === undefined
            ? undefined
            : withIcon(<DurationIcon fontSize="inherit" />, secondary)
        }
      />
    </ListItem>
  );
};
