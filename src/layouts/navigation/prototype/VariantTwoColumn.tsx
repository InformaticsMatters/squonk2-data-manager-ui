// PROTOTYPE — throwaway. Arrangement 2: identity and controls side by side.
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SettingsBrightness as SystemModeIcon,
  ViewSidebar as ViewSidebarIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import { AuthButton } from "../../../components/auth/AuthButton";
import { AnchoredDropdown, SignedOut } from "./AnchoredDropdown";
import { useAccountSummary } from "./shared";

/**
 * Wider and shorter: who you are on the left, what you can change on the right, split by a rule.
 * Trades width for height, and keeps the two kinds of content from being read as one list.
 */
export const VariantTwoColumn = () => {
  const { user, dmRole, asRole, count, isSidebarOpen, setSidebarOpen, signedIn } =
    useAccountSummary();
  const { mode, setMode } = useColorScheme();

  return (
    <AnchoredDropdown width={440}>
      {signedIn ? (
        <Stack direction="row" divider={<Divider flexItem orientation="vertical" />}>
          <Stack spacing={1} sx={{ p: 2, width: 200, alignItems: "center", textAlign: "center" }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
              {user.username?.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, width: "100%" }}>
              <Typography noWrap sx={{ fontWeight: 600 }}>
                {user.username}
              </Typography>
              <Typography noWrap color="text.secondary" variant="caption">
                {user.email ?? "No email"}
              </Typography>
            </Box>
            <Stack spacing={0.5} sx={{ width: "100%" }}>
              <Chip label={dmRole ?? "No DM role"} size="small" />
              <Chip label={asRole ?? "No AS role"} size="small" />
            </Stack>
          </Stack>

          <Stack spacing={1.5} sx={{ p: 2, flexGrow: 1, justifyContent: "center" }}>
            {!!mode && (
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={mode}
                onChange={(_, next: "dark" | "light" | "system" | null) => next && setMode(next)}
              >
                <ToggleButton value="light">
                  <LightModeIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="system">
                  <SystemModeIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="dark">
                  <DarkModeIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            )}

            <Button
              fullWidth
              size="small"
              startIcon={<ViewSidebarIcon fontSize="small" />}
              variant="outlined"
              onClick={() => setSidebarOpen((previous) => !previous)}
            >
              {isSidebarOpen ? "Hide event stream" : `Event stream (${count})`}
            </Button>

            <AuthButton fullWidth color="inherit" mode="logout" size="small" variant="outlined" />
          </Stack>
        </Stack>
      ) : (
        <SignedOut />
      )}
    </AnchoredDropdown>
  );
};
