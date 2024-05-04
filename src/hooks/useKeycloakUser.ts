import { useKeycloakIdToken } from "./useKeycloakIdToken";

export interface User {
  username: string;
  givenName: string;
  familyName: string;
  email: string | null;
  emailVerified: boolean | null;
  roles: string[];
}

/**
 * React hook to access the currently authenticated user and return their user information
 * @returns A modified ID Token with camelCase names and roles at the top level
 */
export const useKeycloakUser = () => {
  const { idToken, ...rest } = useKeycloakIdToken();

  const user = {
    username: idToken.preferred_username,
    givenName: idToken.given_name,
    familyName: idToken.family_name,
    email: idToken.email,
    emailVerified: idToken.email_verified,
    roles: idToken.realm_access?.roles,
  } satisfies Partial<User>;

  return { user, ...rest };
};
