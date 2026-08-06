import { type ComponentType, createElement, useEffect } from "react";

import { useRouter } from "next/router";

import { authClient } from "../../lib/auth-client";
import { withBasePath } from "../../utils/app/basePath";
import { CenterLoader } from "../CenterLoader";

export function withPageAuthRequired<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  const Wrapped = (props: P) => {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
      if (!isPending && !session) {
        // `asPath` excludes Next's base path, so it has to be added back before the round trip
        void authClient.signIn.oauth2({
          providerId: "keycloak",
          callbackURL: withBasePath(router.asPath),
        });
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
