export const REQUIRED_ROLES = [
  process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE,
  process.env.NEXT_PUBLIC_KEYCLOAK_AS_USER_ROLE,
].filter((role): role is string => role !== undefined);
