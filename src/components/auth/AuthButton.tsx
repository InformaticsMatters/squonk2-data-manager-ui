import { Button, type ButtonProps } from "@mui/material";
import { useRouter } from "next/router";

import { useCleanUpOnLogout } from "../../hooks/authHooks";
import { authClient } from "../../lib/auth-client";
import { withBasePath } from "../../utils/app/basePath";
import { capitalise } from "../../utils/app/language";

type ClickableHandler = "login" | "logout";

export interface AuthButtonPros extends ButtonProps {
  mode: ClickableHandler;
}

export const AuthButton = ({ mode, ...ButtonProps }: AuthButtonPros) => {
  const cleanupOnLogout = useCleanUpOnLogout();
  const router = useRouter();

  const handleClick = async () => {
    if (mode === "logout") {
      cleanupOnLogout();
      await authClient.signOut();
      const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER_URL;
      const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
      const postLogout = encodeURIComponent(globalThis.location.origin + withBasePath("/"));
      globalThis.location.href = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${postLogout}&client_id=${clientId}`;
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
