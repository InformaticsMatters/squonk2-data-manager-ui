import { type ComponentType, createElement, useEffect } from "react";

import { useRouter } from "next/router";

import { authClient } from "../../lib/auth-client";
import { CenterLoader } from "../CenterLoader";

export function withPageAuthRequired<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  const Wrapped = (props: P) => {
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
    return createElement(Component, props);
  };
  Wrapped.displayName = `withPageAuthRequired(${Component.displayName ?? Component.name})`;
  return Wrapped;
}
