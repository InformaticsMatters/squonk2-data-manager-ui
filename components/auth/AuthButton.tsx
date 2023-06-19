import type { ButtonProps } from "@mui/material";
import { Button } from "@mui/material";

import { useCleanUpOnLogout } from "../../hooks/authHooks";
import { capitalise } from "../../utils/app/language";

type ClickableHandler = "login" | "logout";
type LinkPropsWithBaseURL = `${string}/${ClickableHandler}`;

export interface AuthButtonPros extends ButtonProps {
  mode: ClickableHandler;
}

/**
 * Button component implemented as an anchor link to handle login and logout
 *
 * This needs to be an normal anchor link despite it being a relative path. See @nextjs-auth0
 * examples on their GitHub.
 *
 * This extends the props of the MuiButton to allow customisation
 */
export const AuthButton = ({ mode, ...ButtonProps }: AuthButtonPros) => {
  const cleanupOnLogout = useCleanUpOnLogout();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <Button
      {...ButtonProps}
      href={`${basePath}/api/auth/${mode}` satisfies LinkPropsWithBaseURL}
      onClick={mode === "logout" ? cleanupOnLogout : undefined}
    >
      {capitalise(mode)}
    </Button>
  );
};
