// PROTOTYPE — throwaway. Arrangement 3: labelled sections, switch-driven.
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SettingsBrightness as SystemModeIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import { AuthButton } from "../../../components/auth/AuthButton";
import { AnchoredDropdown, SignedOut } from "./AnchoredDropdown";
import { useAccountSummary } from "./shared";

const SectionHeading = ({ children }: { children: string }) => (
  <Typography color="text.secondary" sx={{ display: "block", mb: 0.5 }} variant="overline">
    {children}
  </Typography>
);

/**
 * Each concern gets a named section, and the event stream becomes a state you switch rather than
 * an action you press — so the menu reads as settings you can see the current value of, not as a
 * list of things to do.
 */
export const VariantSectioned = () => {
  const { user, dmRole, asRole, count, isSidebarOpen, setSidebarOpen, signedIn } =
    useAccountSummary();
  const { mode, setMode } = useColorScheme();

  return (
    <AnchoredDropdown width={340}>
      {signedIn ? (
        <>
          <Box sx={{ p: 2 }}>
            <SectionHeading>Signed in as</SectionHeading>
            <Typography noWrap sx={{ fontWeight: 600 }}>
              {user.username}
            </Typography>
            <Typography gutterBottom noWrap color="text.secondary" variant="body2">
              {user.email ?? "No email"}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
              <Chip label={dmRole ?? "No DM role"} size="small" />
              <Chip label={asRole ?? "No AS role"} size="small" />
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <SectionHeading>Event stream</SectionHeading>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2">
                {count > 0 ? `${count} new message${count === 1 ? "" : "s"}` : "No new messages"}
              </Typography>
              <Switch checked={isSidebarOpen} onChange={(_, checked) => setSidebarOpen(checked)} />
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <SectionHeading>Appearance</SectionHeading>
            {!!mode && (
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={mode}
                onChange={(_, next: "dark" | "light" | "system" | null) => next && setMode(next)}
              >
                <ToggleButton value="light">
                  <LightModeIcon fontSize="small" sx={{ mr: 0.5 }} /> Light
                </ToggleButton>
                <ToggleButton value="system">
                  <SystemModeIcon fontSize="small" sx={{ mr: 0.5 }} /> Auto
                </ToggleButton>
                <ToggleButton value="dark">
                  <DarkModeIcon fontSize="small" sx={{ mr: 0.5 }} /> Dark
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          <Divider />

          <AuthButton fullWidth color="inherit" mode="logout" sx={{ borderRadius: 0, py: 1.5 }} />
        </>
      ) : (
        <SignedOut />
      )}
    </AnchoredDropdown>
  );
};
