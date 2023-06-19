import { Person as PersonIcon } from "@mui/icons-material";
import { Box, Chip, Typography, useMediaQuery, useTheme } from "@mui/material";

import { AuthButton } from "../../components/auth/AuthButton";
import { CenterLoader } from "../../components/CenterLoader";
import { Chips } from "../../components/Chips";
import { DarkModeSwitch } from "../../components/DarkModeSwitch";
import { useASAuthorizationStatus, useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";

/**
 * Content of the user menu
 */
export const UserMenuContent = () => {
  const { user, isLoading } = useKeycloakUser();
  const asRole = useASAuthorizationStatus();
  const dmRole = useDMAuthorizationStatus();

  const theme = useTheme();

  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Box textAlign={biggerThanMd ? "center" : undefined}>
      <Typography gutterBottom variant="h3">
        Account
      </Typography>
      {isLoading ? (
        <CenterLoader />
      ) : user.username ? (
        <>
          {biggerThanMd && (
            <Box sx={{ fontSize: 80 }}>
              <PersonIcon color="disabled" fontSize="inherit" />
            </Box>
          )}
          <Typography fontWeight="bold">{user.username}</Typography>
          <Typography>
            Roles:
            <Chips>
              <Chip label={dmRole ?? "No DM Role"} size="small" />
              <Chip label={asRole ?? "No AS Role"} size="small" />
            </Chips>
          </Typography>
          <AuthButton mode="logout" sx={{ marginY: 1 }} />
        </>
      ) : (
        <Typography>
          <AuthButton mode="login" />
        </Typography>
      )}
      <DarkModeSwitch />
    </Box>
  );
};
