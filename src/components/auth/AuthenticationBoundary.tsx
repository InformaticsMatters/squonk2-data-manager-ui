import { type ReactNode, useEffect } from "react";

import { useRouter } from "next/router";

import { authClient } from "../../lib/auth-client";
import { CenterLoader } from "../CenterLoader";

export const AuthenticationBoundary = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      void authClient.signIn.oauth2({ providerId: "keycloak", callbackURL: router.asPath });
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return <CenterLoader />;
  }
  return children;
};
