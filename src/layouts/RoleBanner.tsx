import { Box, Tooltip, Typography } from "@mui/material";

import { useIsEvaluator, useIsPlatformAdmin } from "../hooks/useIsAuthorized";

/**
 * The mark a role wears: what it is called, and what it changes about the deployment the caller
 * sees. Each states the consequence rather than the role's name alone, because the role is only
 * worth marking where it makes the application behave unlike it does for everyone else.
 */
const marks = {
  admin: {
    palette: "warning",
    label: "Administrator access",
    summary:
      "You hold the platform administrator role, so organisation and unit lists show every one in this deployment — not only the ones you belong to. Some of those you can see but not act in.",
  },
  evaluator: {
    palette: "info",
    label: "Evaluation access",
    summary:
      "You hold the evaluation role, so projects and subscriptions can only be created in your personal unit, and only at the evaluation tier.",
  },
} as const;

/**
 * The mark the caller's session wears, if any.
 *
 * The roles are exclusive: each hook reads the prevailing account server role, and an account
 * holding the admin role is not an evaluator.
 */
const useSessionMark = () => {
  const isAdmin = useIsPlatformAdmin();
  const isEvaluator = useIsEvaluator();

  if (isAdmin) {
    return marks.admin;
  }
  return isEvaluator ? marks.evaluator : undefined;
};

/**
 * A standing mark that the caller's role changes what the application will do, shown on every page
 * the chrome serves. A caller who is signed out, or who holds neither role, holds no mark, so the
 * public pages this layout also carries are unmarked without deciding anything about them here.
 *
 * An administrator sees every organisation and unit the deployment has, because the account server
 * widens what it returns for the role rather than because a list has lost its filter — the
 * confusion issue #2079 records. An evaluator meets the opposite: units they can see but cannot
 * create anything in. Either way the application behaved unlike its documentation and said
 * nothing.
 *
 * The frame is drawn rather than a message placed in the page so that it costs no layout space and
 * cannot be dismissed on the page where the surprise appears; it does not take pointer events, so
 * nothing beneath it becomes unclickable.
 */
export const RoleBanner = () => {
  const mark = useSessionMark();

  if (!mark) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        border: 3,
        borderColor: `${mark.palette}.main`,
      }}
    >
      {/* Described rather than labelled: the mark's own text names it, and a tooltip taken as the
          accessible name would rename the element after what the role happens to restrict. The
          text itself carries the focus, so the explanation is reachable from the keyboard rather
          than on hover alone. */}
      <Tooltip describeChild title={mark.summary}>
        <Typography
          sx={{
            position: "absolute",
            bottom: 0,
            left: 16,
            px: 1.5,
            borderRadius: "4px 4px 0 0",
            bgcolor: `${mark.palette}.main`,
            color: `${mark.palette}.contrastText`,
            pointerEvents: "auto",
          }}
          tabIndex={0}
          variant="caption"
        >
          {mark.label}
        </Typography>
      </Tooltip>
    </Box>
  );
};
