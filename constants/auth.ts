/**
 * OAuth roles used by the data manager. Given in order, i.e the second entry is a superset of the
 * first and so on
 */
export const DM_ROLES = [
  process.env.NEXT_PUBLIC_KEYCLOAK_DM_EVALUATOR_ROLE as string,
  process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE as string,
  process.env.NEXT_PUBLIC_KEYCLOAK_DM_ADMIN_ROLE as string,
];

/**
 * OAuth roles used by the account server. Given in order, i.e the second entry is a superset of the
 * first and so on
 */
export const AS_ROLES = [
  process.env.NEXT_PUBLIC_KEYCLOAK_AS_EVALUATOR_ROLE as string,
  process.env.NEXT_PUBLIC_KEYCLOAK_AS_USER_ROLE as string,
  process.env.NEXT_PUBLIC_KEYCLOAK_AS_ADMIN_ROLE as string,
];
