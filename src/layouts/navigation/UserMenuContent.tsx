import { Person as PersonIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAtom } from "jotai";

import { AuthButton } from "../../components/auth/AuthButton";
import { CenterLoader } from "../../components/CenterLoader";
import { Chips } from "../../components/Chips";
import { ColourSchemeSelection } from "../../components/ColourSchemeSelection";
import { useASAuthorizationStatus, useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { eventStreamEnabledAtom } from "../../state/eventStream";

/**
 * Content of the user menu
 */
export const UserMenuContent = () => {
  const theme = useTheme();
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));
  const [eventStreamEnabled, setEventStreamEnabled] = useAtom(eventStreamEnabledAtom);

  return (
    <Box sx={{ textAlign: biggerThanMd ? "center" : undefined }}>
      <Typography gutterBottom variant="h3">
        Account
      </Typography>
      <UserMenuContentInner />
      <ColourSchemeSelection />
      <FormControlLabel
        control={
          <Switch
            checked={eventStreamEnabled}
            color="primary"
            onChange={(_, checked) => setEventStreamEnabled(checked)}
          />
        }
        label="Event stream (alpha)"
        sx={{ mb: 2 }}
      />
    </Box>
  );
};

const UserMenuContentInner = () => {
  const asRole = useASAuthorizationStatus();
  const dmRole = useDMAuthorizationStatus();
  const { user, isLoading, error } = useKeycloakUser();

  const theme = useTheme();
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));

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
        {!!biggerThanMd && (
          <Box sx={{ fontSize: 80 }}>
            <PersonIcon color="disabled" fontSize="inherit" />
          </Box>
        )}
        <Typography sx={{ fontWeight: "bold" }}>{user.username}</Typography>
        <Box>
          Roles:
          <Chips>
            <Chip label={dmRole ?? "No DM Role"} size="small" />
            <Chip label={asRole ?? "No AS Role"} size="small" />
          </Chips>
        </Box>
        <AuthButton mode="logout" sx={{ marginY: 1 }} />
      </>
    );
  }

  return <AuthButton mode="login" />;
};
