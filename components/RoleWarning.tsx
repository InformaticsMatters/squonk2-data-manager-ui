import { Alert, Box } from "@mui/material";

import { REQUIRED_ROLES } from "../constants/auth";
import { useIsAuthorized } from "../hooks/useIsAuthorized";
import { useKeycloakUser } from "../hooks/useKeycloakUser";

export const RoleWarning = () => {
  const isAuthorized = useIsAuthorized();
  const { user } = useKeycloakUser();

  const missingRoles = REQUIRED_ROLES.filter((role) => !user.roles?.includes(role));

  if (user.username !== undefined && !isAuthorized) {
    return (
      <Box m={2}>
        <Alert severity="warning">
          You are missing required roles ({missingRoles.join(", ")}) to access this service. Please
          contact an administrator.
        </Alert>
      </Box>
    );
  }

  return null;
};
