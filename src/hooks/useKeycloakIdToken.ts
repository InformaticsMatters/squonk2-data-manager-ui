import { useEffect, useState } from "react";

import { authClient } from "../lib/auth-client";

type RealmAccess = { roles: string[] };

type ExtendedUser = {
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  emailVerified?: boolean;
  realm_access?: string;
};

const emptyIdToken = {
  preferred_username: undefined,
  given_name: undefined,
  family_name: undefined,
  email: undefined,
  email_verified: undefined,
  realm_access: undefined,
} as const;

export const useKeycloakIdToken = () => {
  // Defer session-derived rendering until after hydration. better-auth's
  // useSession is client-only, so on the server it always reports
  // "pending / no user", but on the client the session can be available
  // synchronously from a prior fetch. Returning the empty/loading shape on
  // the first client render keeps SSR and hydration output identical and
  // avoids React 19 hydration warnings on every auth-dependent element.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const { data: session, isPending, error } = authClient.useSession();
  const user = session?.user as ExtendedUser | undefined;

  if (!hydrated) {
    return { idToken: emptyIdToken, isLoading: true, error: null };
  }

  const idToken = {
    preferred_username: user?.preferred_username,
    given_name: user?.given_name,
    family_name: user?.family_name,
    email: user?.email,
    email_verified: user?.emailVerified,
    realm_access: user?.realm_access ? (JSON.parse(user.realm_access) as RealmAccess) : undefined,
  };

  return { idToken, isLoading: isPending, error };
};
