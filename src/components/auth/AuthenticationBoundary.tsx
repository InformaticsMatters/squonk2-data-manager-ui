import { type ReactNode, useEffect } from "react";

import { useRouter } from "next/router";

import { authClient } from "../../lib/auth-client";
import { withBasePath } from "../../utils/app/basePath";

/** `fallback` stands in for the page while the session is pending or being signed in again. */
export const AuthenticationBoundary = ({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      void authClient.signIn.social({
        provider: "keycloak",
        callbackURL: withBasePath(router.asPath),
      });
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return fallback;
  }
  return children;
};
