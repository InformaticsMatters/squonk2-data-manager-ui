import { useUser } from "@auth0/nextjs-auth0";

type RealmAccess = {
  roles: string[];
};

export const useKeycloakIdToken = () => {
  // Get the id token via auth0
  const { user, ...rest } = useUser();

  const typedIdToken = {
    ...user,
    preferred_username: user?.preferred_username as string | undefined,
    given_name: user?.given_name as string | undefined,
    family_name: user?.family_name as string | undefined,
    realm_access: user?.realm_access as RealmAccess | undefined,
  };

  return { idToken: typedIdToken, ...rest };
};
