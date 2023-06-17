import { Person as PersonIcon } from "@mui/icons-material";
import { Box, Chip, Typography, useMediaQuery, useTheme } from "@mui/material";

import { CenterLoader } from "../../components/CenterLoader";
import { Chips } from "../../components/Chips";
import { DarkModeSwitch } from "../../components/DarkModeSwitch";
import { NextLink } from "../../components/NextLink";
import { useCleanUpOnLogout } from "../../hooks/authHooks";
import { useASAuthorizationStatus, useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";

/**
 * Content of the user menu
 */
export const UserMenuContent = () => {
  const { user, isLoading } = useKeycloakUser();
  const cleanupOnLogout = useCleanUpOnLogout();
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
          <NextLink
            component="button"
            href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/logout` as any}
            sx={{ marginY: 1 }}
            onClick={cleanupOnLogout}
          >
            Logout
          </NextLink>
        </>
      ) : (
        <Typography>
          <NextLink
            component="button"
            href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/login` as any}
            variant="outlined"
          >
            Login
          </NextLink>
        </Typography>
      )}
      <DarkModeSwitch />
    </Box>
  );
};
