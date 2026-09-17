import { Box, Tooltip, Typography } from "@mui/material";

import { useIsPlatformAdmin } from "../hooks/useIsAuthorized";

const SUMMARY =
  "You hold the platform administrator role, so organisation and unit lists show every one in this deployment — not only the ones you belong to. Some of those you can see but not act in.";

/**
 * A standing mark that the caller is an administrator, shown on every page of the authenticated
 * shell.
 *
 * An admin sees every organisation and unit the deployment has, because the account server widens
 * what it returns for the role rather than because a list has lost its filter — the confusion
 * issue #2079 records. The frame is drawn rather than a message placed in the page so that it
 * costs no layout space and cannot be dismissed on the page where the surprise appears; it does
 * not take pointer events, so nothing beneath it becomes unclickable.
 */
export const AdminBanner = () => {
  if (!useIsPlatformAdmin()) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: "appBar",
        pointerEvents: "none",
        border: 3,
        borderColor: "warning.main",
        displayPrint: "none",
      }}
    >
      <Tooltip title={SUMMARY}>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 16,
            px: 1.5,
            borderRadius: "4px 4px 0 0",
            bgcolor: "warning.main",
            color: "warning.contrastText",
            pointerEvents: "auto",
          }}
        >
          <Typography variant="caption">Administrator access</Typography>
        </Box>
      </Tooltip>
    </Box>
  );
};
