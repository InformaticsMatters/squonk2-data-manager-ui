import { Button, type ButtonProps } from "@mui/material";
import Router from "next/router";

import { clearAccountScopedStorageOnLogout } from "../../application/logoutCleanup";
import { authClient } from "../../lib/auth-client";
import { withBasePath } from "../../utils/app/basePath";
import { capitalise } from "../../utils/app/language";

type ClickableHandler = "login" | "logout";

export interface AuthButtonPros extends ButtonProps {
  mode: ClickableHandler;
}

export const AuthButton = ({ mode, ...ButtonProps }: AuthButtonPros) => {
  // The singleton router rather than `useRouter`, which throws unless a router is mounted above
  // it. Where the caller currently is matters only once login has been clicked, so it is read
  // then — which keeps this button renderable outside the application, in a story for instance.
  // `asPath` is the same value either way.
  const handleClick = async () => {
    if (mode === "logout") {
      clearAccountScopedStorageOnLogout({ local: localStorage, session: sessionStorage });
      // Signing out is left to the route, which needs the session the client would have discarded:
      // the ID token it reads from it is what spares the caller Keycloak's confirmation page.
      globalThis.location.href = withBasePath("/api/auth/keycloak-logout");
    } else {
      await authClient.signIn.social({
        provider: "keycloak",
        callbackURL: withBasePath(Router.asPath),
      });
    }
  };

  return (
    <Button {...ButtonProps} onClick={() => void handleClick()}>
      {capitalise(mode)}
    </Button>
  );
};
