import { Activity } from "react";

import {
  Launch as LaunchIcon,
  Person as PersonIcon,
  ViewSidebar as ViewSidebarIcon,
} from "@mui/icons-material";
import { Alert, Box, Button, Chip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useAtom } from "jotai";

import { AuthButton } from "../../components/auth/AuthButton";
import { CenterLoader } from "../../components/CenterLoader";
import { Chips } from "../../components/Chips";
import { ColourSchemeSelection } from "../../components/ColourSchemeSelection";
import { EventStreamMessages } from "../../components/eventStream/EventStreamMessages";
import { useASAuthorizationStatus, useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { eventStreamSidebarOpenAtom } from "../../state/eventStream";
import { useUnreadEventCount } from "../../state/notifications";

interface UserMenuContentInnerProps {
  onEventStreamToggle?: () => void;
}

interface UserMenuContentProps {
  onEventStreamToggle?: () => void;
}

const UserMenuContentInner = ({ onEventStreamToggle }: UserMenuContentInnerProps) => {
  const asRole = useASAuthorizationStatus();
  const dmRole = useDMAuthorizationStatus();
  const { user, isLoading, error } = useKeycloakUser();
  const [isSidebarOpen, setSidebarOpen] = useAtom(eventStreamSidebarOpenAtom);

  const theme = useTheme();
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));
  const { count } = useUnreadEventCount();

  if (error) {
    return (
      <Alert severity="error">
        <Typography>
          {error.message || "We couldn't log you in. Please try clearing cookies and refresh."}
        </Typography>
      </Alert>
    );
  }

  if (isLoading) {
    return <CenterLoader />;
  }

  if (user.username) {
    return (
      <>
        <Activity mode={biggerThanMd ? "visible" : "hidden"}>
          <Box sx={{ fontSize: 80 }}>
            <PersonIcon color="disabled" fontSize="inherit" />
          </Box>
        </Activity>
        <Typography sx={{ fontWeight: "bold" }}>{user.username}</Typography>
        <Box>
          Roles:
          <Chips sx={{ justifyContent: "center" }}>
            <Chip label={dmRole ?? "No DM Role"} size="small" />
            <Chip label={asRole ?? "No AS Role"} size="small" />
          </Chips>
        </Box>
        <AuthButton mode="logout" sx={{ marginY: 1 }} />
        <Activity mode={biggerThanMd ? "visible" : "hidden"}>
          <Button
            fullWidth
            size="small"
            startIcon={isSidebarOpen ? <ViewSidebarIcon /> : <LaunchIcon />}
            sx={{ marginY: 1 }}
            variant="outlined"
            onClick={() =>
              setSidebarOpen((prev) => {
                const next = !prev;
                if (next) {
                  onEventStreamToggle?.();
                }
                return next;
              })
            }
          >
            {isSidebarOpen ? "Hide event stream" : `Show event stream - ${count} new message(s)`}
          </Button>
        </Activity>
      </>
    );
  }

  return <AuthButton mode="login" />;
};

/**
 * Content of the user menu
 */
export const UserMenuContent = ({ onEventStreamToggle }: UserMenuContentProps) => {
  const theme = useTheme();
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));
  // Removed eventStreamEnabledAtom usage, now handled in EventStreamToggle

  return (
    <Box sx={{ textAlign: biggerThanMd ? "center" : undefined }}>
      <Typography gutterBottom variant="h3">
        Account
      </Typography>
      <UserMenuContentInner onEventStreamToggle={onEventStreamToggle} />
      <ColourSchemeSelection />
      {!biggerThanMd && <EventStreamMessages />}
    </Box>
  );
};
