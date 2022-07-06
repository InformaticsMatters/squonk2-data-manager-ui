import { Link, Typography } from "@mui/material";

import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { CenterLoader } from "../CenterLoader";
import { UserSettings } from "../UserSettings";

/**
 * Content of the user menu
 */
export const UserMenuContent = () => {
  const { user, isLoading } = useKeycloakUser();
  return (
    <>
      <Typography gutterBottom variant="h3">
        Account
      </Typography>
      {isLoading ? (
        <CenterLoader />
      ) : user.username ? (
        <>
          <Typography>
            {user.username} /{" "}
            <Link href="/api/auth/logout" onClick={() => localStorage.clear()}>
              Logout
            </Link>
          </Typography>
          <UserSettings />
        </>
      ) : (
        <Typography>
          <Link href="/api/auth/login">Login</Link>
        </Typography>
      )}
    </>
  );
};
