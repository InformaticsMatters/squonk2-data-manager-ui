import { Button, type ButtonProps } from "@mui/material";
import { useRouter } from "next/router";

import { clearAccountScopedStorageOnLogout } from "../../application/logoutCleanup";
import { authClient } from "../../lib/auth-client";
import { withBasePath } from "../../utils/app/basePath";
import { capitalise } from "../../utils/app/language";

type ClickableHandler = "login" | "logout";

export interface AuthButtonPros extends ButtonProps {
  mode: ClickableHandler;
}

export const AuthButton = ({ mode, ...ButtonProps }: AuthButtonPros) => {
  const router = useRouter();

  const handleClick = async () => {
    if (mode === "logout") {
      clearAccountScopedStorageOnLogout({ local: localStorage, session: sessionStorage });
      await authClient.signOut();
      globalThis.location.href = withBasePath("/api/auth/keycloak-logout");
    } else {
      await authClient.signIn.oauth2({
        providerId: "keycloak",
        callbackURL: withBasePath(router.asPath),
      });
    }
  };

  return (
    <Button {...ButtonProps} onClick={() => void handleClick()}>
      {capitalise(mode)}
    </Button>
  );
};
