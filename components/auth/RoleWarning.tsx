import { Alert, Box } from "@mui/material";

import { useIsAuthorized } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";

export const RoleWarning = () => {
  const [dmAuthorization, asAuthorization] = useIsAuthorized();
  const { user } = useKeycloakUser();

  if (
    user.username !== undefined &&
    (dmAuthorization === undefined || asAuthorization === undefined)
  ) {
    return (
      <Box m={2}>
        <Alert severity="warning">
          You are missing required roles to access this service. Please contact an administrator.
          <Box marginY={1}>
            {(user.roles ?? []).length > 0 ? (
              <>
                {" "}
                You have the roles:
                <ul>
                  {user.roles?.map((role) => (
                    <li key={role}>{role}</li>
                  ))}
                </ul>
              </>
            ) : (
              "You have no roles"
            )}
          </Box>
        </Alert>
      </Box>
    );
  }

  return null;
};
