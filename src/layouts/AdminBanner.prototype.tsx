/**
 * PROTOTYPE ONLY — throwaway. Four variants of the "you are an admin" banner, mounted in the
 * authenticated layout so every page shows it, switchable via `?variant=` from the floating bar.
 *
 * The question: how loudly should the app say "you hold the account-server admin role, so the
 * organisation and unit lists you see are everyone's, not yours"? See issue #2079 — a unit list that
 * looked unfiltered was the admin role, not a filtering bug.
 *
 * Nothing here is production code: no dismissal persistence, no i18n, no tests.
 */
import { useState } from "react";

import { AdminPanelSettings } from "@mui/icons-material";
import { Alert, AlertTitle, Box, Chip, Stack, Tooltip, Typography } from "@mui/material";

import { type PrototypeVariant, usePrototypeVariant } from "../components/PrototypeSwitcher";
import { useASAuthorizationStatus } from "../hooks/useIsAuthorized";

/**
 * The real gate, for reference — when a variant wins, the banner renders only when this is true.
 * The prototype deliberately ignores it so the design can be judged without holding the role.
 */
export const useIsPlatformAdmin = () =>
  useASAuthorizationStatus() === process.env.NEXT_PUBLIC_KEYCLOAK_AS_ADMIN_ROLE;

const HEADLINE = "Administrator access";
const SUMMARY =
  "You hold the platform administrator role, so organisation and unit lists show every one in this deployment — not only the ones you belong to.";

/** A: full-bleed strip under the masthead. Takes layout space; impossible to miss or dismiss. */
const VariantA = () => (
  <Box
    sx={{
      bgcolor: "warning.main",
      color: "warning.contrastText",
      px: 2,
      py: 0.75,
      displayPrint: "none",
    }}
  >
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <AdminPanelSettings fontSize="small" />
      <Typography variant="body2">
        <strong>{HEADLINE}</strong> — {SUMMARY}
      </Typography>
    </Stack>
  </Box>
);

/** B: corner pill. Costs no layout space; ambient rather than announced. Folded in, this belongs
 *  inline in `NavBarContents` next to the user menu rather than pinned over it. */
const VariantB = () => (
  <Tooltip title={SUMMARY}>
    <Chip
      color="warning"
      icon={<AdminPanelSettings />}
      label="Admin"
      size="small"
      sx={{ position: "fixed", top: 12, right: 200, zIndex: 1300, displayPrint: "none" }}
    />
  </Tooltip>
);

/** C: in-content alert, dismissible for the session, and the only variant that spells out the
 *  consequences rather than just the state. */
const VariantC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      sx={{ mx: 2, mt: 2, displayPrint: "none" }}
      onClose={() => setDismissed(true)}
    >
      <AlertTitle>{HEADLINE}</AlertTitle>
      <Typography variant="body2">While you hold this role:</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        <Typography component="li" variant="body2">
          Organisation and unit lists show every one in the deployment, including other
          people&apos;s personal units.
        </Typography>
        <Typography component="li" variant="body2">
          Some of those you can see but not act in — creating a project there may still be refused.
        </Typography>
      </Box>
    </Alert>
  );
};

/** D: ambient frame. No layout shift at all — the whole viewport is outlined, with a label tab. */
const VariantD = () => (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 1400,
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
        <Typography variant="caption">{HEADLINE}</Typography>
      </Box>
    </Tooltip>
  </Box>
);

export const adminBannerVariants: PrototypeVariant[] = [
  { key: "A", name: "Masthead strip" },
  { key: "B", name: "Corner pill" },
  { key: "C", name: "In-content alert" },
  { key: "D", name: "Viewport frame" },
  { key: "off", name: "No banner" },
];

const banners: Record<string, (() => React.JSX.Element | null) | undefined> = {
  A: VariantA,
  B: VariantB,
  C: VariantC,
  D: VariantD,
};

export const AdminBannerPrototype = () => {
  const { variant } = usePrototypeVariant(adminBannerVariants);
  const Banner = banners[variant.key];

  if (!Banner) {
    return null;
  }
  return <Banner />;
};
