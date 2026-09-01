// PROTOTYPE — throwaway. Arrangement 4: the inverted hierarchy.
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SettingsBrightness as SystemModeIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import { AuthButton } from "../../../components/auth/AuthButton";
import { AnchoredDropdown, SignedOut } from "./AnchoredDropdown";
import { useAccountSummary, useUserMenuOpen } from "./shared";

const MODES = [
  { key: "light", label: "Light", icon: <LightModeIcon fontSize="small" /> },
  { key: "system", label: "Auto", icon: <SystemModeIcon fontSize="small" /> },
  { key: "dark", label: "Dark", icon: <DarkModeIcon fontSize="small" /> },
] as const;

/**
 * Identity is the least-used thing in this menu — the badge is what brought you here — so the
 * unread count leads and the account details sink to a footer strip beside sign out.
 */
export const VariantStatusFirst = () => {
  const { user, dmRole, asRole, count, isSidebarOpen, setSidebarOpen, signedIn } =
    useAccountSummary();
  const { mode, setMode } = useColorScheme();
  const [, setMenuOpen] = useUserMenuOpen();

  return (
    <AnchoredDropdown width={320}>
      {signedIn ? (
        <>
          <Box sx={{ p: 2, bgcolor: "action.hover" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", mb: 1 }}>
              <Typography color={count > 0 ? "success.main" : "text.disabled"} variant="h2">
                {count}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                new event{count === 1 ? "" : "s"} since you arrived
              </Typography>
            </Stack>
            <Button
              fullWidth
              size="small"
              variant={isSidebarOpen ? "outlined" : "contained"}
              onClick={() => {
                setSidebarOpen((previous) => !previous);
                // The stream is what you came for — leaving the menu over it defeats the trip.
                setMenuOpen(false);
              }}
            >
              {isSidebarOpen ? "Hide event stream" : "Show event stream"}
            </Button>
          </Box>

          <Divider />

          <Stack
            direction="row"
            sx={{ px: 2, py: 1, alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography color="text.secondary" variant="body2">
              Theme
            </Typography>
            <Stack direction="row" spacing={0.5}>
              {MODES.map(({ key, label, icon }) => (
                <Tooltip key={key} title={label}>
                  <IconButton
                    color={mode === key ? "primary" : "default"}
                    size="small"
                    onClick={() => setMode(key)}
                  >
                    {icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          </Stack>

          <Divider />

          <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: "center" }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
              {user.username?.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user.username}
              </Typography>
              {/* Role names are deployment-configured, so no length can be assumed: one per line,
                  each clipped. `noWrap` alone would not clip — a caption renders an inline span,
                  which ignores overflow, which is how these slid under the button. */}
              {[dmRole ?? "no DM role", asRole ?? "no AS role"].map((role) => (
                <Typography
                  noWrap
                  color="text.secondary"
                  key={role}
                  sx={{ display: "block", lineHeight: 1.3 }}
                  variant="caption"
                >
                  {role}
                </Typography>
              ))}
            </Box>
            <AuthButton color="inherit" mode="logout" size="small" sx={{ flexShrink: 0 }} />
          </Stack>
        </>
      ) : (
        <SignedOut />
      )}
    </AnchoredDropdown>
  );
};
