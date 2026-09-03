import { type ReactNode } from "react";

import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SettingsBrightness as SystemModeIcon,
} from "@mui/icons-material";
import {
  Alert,
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

import { AuthButton } from "../../components/auth/AuthButton";
import { CenterLoader } from "../../components/CenterLoader";

const MODES = [
  { key: "light", label: "Light", icon: <LightModeIcon fontSize="small" /> },
  { key: "system", label: "Auto", icon: <SystemModeIcon fontSize="small" /> },
  { key: "dark", label: "Dark", icon: <DarkModeIcon fontSize="small" /> },
] as const;

/**
 * The colour scheme as three exclusive icons rather than a labelled radio group: it is a
 * secondary control in a small panel, and its current value is legible from which icon is lit.
 */
const ThemeRow = () => {
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  return (
    <Stack
      direction="row"
      sx={{ px: 2, py: 1, alignItems: "center", justifyContent: "space-between" }}
    >
      <Typography color="text.secondary" variant="body2">
        Theme
      </Typography>
      <Stack aria-label="Theme" direction="row" role="group" spacing={0.5}>
        {MODES.map(({ key, label, icon }) => (
          <Tooltip key={key} title={label}>
            <IconButton
              aria-label={label}
              aria-pressed={mode === key}
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
  );
};

export interface UserMenuContentProps {
  /** The signed-in caller, or `undefined` while signed out. */
  username?: string;
  dmRole?: string;
  asRole?: string;
  /** Unread events as they stood when the menu was opened. */
  unreadCount: number;
  isSidebarOpen: boolean;
  /**
   * Whether the event stream sidebar exists at this width. Below `md` it does not render at all,
   * so the menu carries the stream itself rather than offering a toggle that would do nothing.
   */
  isSidebarAvailable: boolean;
  onEventStreamToggle: () => void;
  /** The stream itself, shown in place of the toggle when there is no sidebar to open. */
  inlineEventStream?: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Contents of the account menu.
 *
 * The unread count leads and identity sinks to a footer strip: the badge is what brings a caller
 * here, and who they are signed in as is the thing they are least often checking.
 */
export const UserMenuContent = ({
  username,
  dmRole,
  asRole,
  unreadCount,
  isSidebarOpen,
  isSidebarAvailable,
  onEventStreamToggle,
  inlineEventStream,
  isLoading = false,
  error = null,
}: UserMenuContentProps) => {
  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 0 }}>
        {error.message || "We couldn't log you in. Please try clearing cookies and refresh."}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <CenterLoader />
      </Box>
    );
  }

  if (!username) {
    // The colour scheme is not an account setting, so it stays available to a caller who has not
    // signed in — as it was when this menu carried a radio group above the sign-in button.
    return (
      <>
        <AuthButton fullWidth mode="login" sx={{ m: 2, width: "auto" }} variant="contained" />
        <Divider />
        <ThemeRow />
      </>
    );
  }

  return (
    <>
      <Box sx={{ p: 2, bgcolor: "action.hover" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", mb: 1 }}>
          <Typography color={unreadCount > 0 ? "success.main" : "text.disabled"} variant="h2">
            {unreadCount}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            new event{unreadCount === 1 ? "" : "s"} since you last looked
          </Typography>
        </Stack>
        {isSidebarAvailable ? (
          <Button
            fullWidth
            size="small"
            variant={isSidebarOpen ? "outlined" : "contained"}
            onClick={onEventStreamToggle}
          >
            {isSidebarOpen ? "Hide event stream" : "Show event stream"}
          </Button>
        ) : (
          inlineEventStream
        )}
      </Box>

      <Divider />

      <ThemeRow />

      <Divider />

      <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: "center" }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
          {username.slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {username}
          </Typography>
          {/* Role names are deployment-configured, so no length can be assumed: one per line, each
              clipped. `noWrap` alone would not clip these — a caption renders an inline span, and
              an inline box ignores overflow, which is how they slid under the sign-out button. */}
          {[dmRole ?? "No DM role", asRole ?? "No AS role"].map((role) => (
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
  );
};
