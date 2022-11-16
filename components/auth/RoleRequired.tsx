import type { FC, ReactNode } from "react";

import Error from "next/error";

import { useKeycloakUser } from "../../hooks/useKeycloakUser";

export interface RoleRequiredProps {
  children?: ReactNode;
  /**
   * Roles the user is required to have.
   */
  roles?: string[];
}

/**
 * The API is protected by user roles. A authenticated might not be authorized to use the app.
 */
export const RoleRequired: FC<RoleRequiredProps> = ({ children, roles }) => {
  const { user } = useKeycloakUser();

  if ((roles ?? []).every((role) => !!user.roles?.includes(role))) {
    return <div>{children}</div>;
  }

  return (
    <Error
      statusCode={403}
      title="Forbidden. You are likely missing the required user role. Please contact an administrator."
    />
  );
};
