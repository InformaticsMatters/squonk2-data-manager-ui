import type { FC } from 'react';
import React from 'react';

import Error from 'next/error';

import { useKeycloakUser } from '../hooks/useKeycloakUser';

export interface RoleRequiredProps {
  roles?: string[];
}

export const RoleRequired: FC<RoleRequiredProps> = ({ children, roles }) => {
  const { user } = useKeycloakUser();

  if ((roles ?? []).every((role) => user.roles?.includes(role))) {
    return <div>{children}</div>;
  }

  return (
    <Error
      statusCode={403}
      title="Forbidden. You are likely missing the required user role. Please contact an administrator."
    />
  );
};
