import { Link, Typography } from "@mui/material";

import { CenterLoader } from "../../components/CenterLoader";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import type { SettingsControls } from "./ToolbarContents";

export interface UserMenuContentProps extends SettingsControls {
  closeOpener: () => void;
}

/**
 * Content of the user menu
 */
export const UserMenuContent = ({ openSettings, closeOpener }: UserMenuContentProps) => {
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
              href={process.env.NEXT_PUBLIC_BASE_PATH + `/api/auth/logout`}
              onClick={() => {
                localStorage.clear();
                setUnit();
                setOrganisation();
              }}
            >
              Logout
            </Link>
          </Typography>
          <Link
            component="button"
            variant="body1"
            onClick={() => {
              openSettings();
              closeOpener();
            }}
          >
            Settings
          </Link>
        </>
      ) : (
        <Typography>
          <Link href={process.env.NEXT_PUBLIC_BASE_PATH + `/api/auth/login`}>Login</Link>
        </Typography>
      )}
    </>
  );
};
