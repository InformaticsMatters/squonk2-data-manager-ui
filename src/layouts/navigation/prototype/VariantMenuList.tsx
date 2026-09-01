// PROTOTYPE — throwaway. Arrangement 1: everything is a menu row.
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  SettingsBrightness as SystemModeIcon,
  ViewSidebar as ViewSidebarIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import { clearAccountScopedStorageOnLogout } from "../../../application/logoutCleanup";
import { authClient } from "../../../lib/auth-client";
import { withBasePath } from "../../../utils/app/basePath";
import { AnchoredDropdown, SignedOut } from "./AnchoredDropdown";
import { useAccountSummary } from "./shared";

const MODES = ["light", "dark", "system"] as const;
const MODE_ICONS = {
  light: <LightModeIcon fontSize="small" />,
  dark: <DarkModeIcon fontSize="small" />,
  system: <SystemModeIcon fontSize="small" />,
};

/**
 * No sections, no cards: a small identity line and then one column of equal-height rows, the way
 * an account menu in a developer tool usually reads. Theme is a row that cycles rather than a
 * control that occupies space.
 */
export const VariantMenuList = () => {
  const { user, dmRole, asRole, count, isSidebarOpen, setSidebarOpen, signedIn } =
    useAccountSummary();
  const { mode, setMode } = useColorScheme();

  return (
    <AnchoredDropdown width={280}>
      {signedIn ? (
        <>
          <Stack direction="row" spacing={1.5} sx={{ px: 2, py: 1.5, alignItems: "center" }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
              {user.username?.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user.username}
              </Typography>
              <Typography color="text.secondary" sx={{ display: "block" }} variant="caption">
                {[dmRole ?? "no DM role", asRole ?? "no AS role"].join(" · ")}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <MenuList sx={{ py: 0.5 }}>
            <MenuItem onClick={() => setSidebarOpen((previous) => !previous)}>
              <ListItemIcon>
                <ViewSidebarIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{isSidebarOpen ? "Hide event stream" : "Event stream"}</ListItemText>
              {!isSidebarOpen && count > 0 && (
                <Typography color="success.main" sx={{ fontWeight: 600 }} variant="body2">
                  {count}
                </Typography>
              )}
            </MenuItem>

            {!!mode && (
              <MenuItem
                onClick={() => setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length] ?? "system")}
              >
                <ListItemIcon>{MODE_ICONS[mode]}</ListItemIcon>
                <ListItemText>Theme</ListItemText>
                <Typography
                  color="text.secondary"
                  sx={{ textTransform: "capitalize" }}
                  variant="body2"
                >
                  {mode}
                </Typography>
              </MenuItem>
            )}

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              onClick={() => {
                clearAccountScopedStorageOnLogout({ local: localStorage, session: sessionStorage });
                void authClient.signOut().then(() => {
                  globalThis.location.href = withBasePath("/api/auth/keycloak-logout");
                });
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sign out</ListItemText>
            </MenuItem>
          </MenuList>
        </>
      ) : (
        <SignedOut />
      )}
    </AnchoredDropdown>
  );
};
