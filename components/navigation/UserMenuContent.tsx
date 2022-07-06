import { Link, Typography } from "@mui/material";

import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { CenterLoader } from "../CenterLoader";
import { UserSettings } from "../UserSettings";

/**
 * Content of the user menu
 */
export const UserMenuContent = () => {
  const { user, isLoading } = useKeycloakUser();
  const [, setUnit] = useSelectedUnit();
  const [, setOrganisation] = useSelectedOrganisation();

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
            <Link
              href="/api/auth/logout"
              onClick={() => {
                localStorage.clear();
                setUnit();
                setOrganisation();
              }}
            >
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
