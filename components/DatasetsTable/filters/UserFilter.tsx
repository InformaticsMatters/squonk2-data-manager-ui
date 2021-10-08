import { useMemo } from 'react';

import type { UserSummary } from '@squonk/data-manager-client';
import { useGetUsers } from '@squonk/data-manager-client/user';

import { Typography } from '@material-ui/core';

import { AutocompleteFilter } from './AutocompleteFilter';

export interface UserFilterProps {
  user?: UserSummary;
  setUser: (user?: UserSummary) => void;
}

export const UserFilter = ({ user, setUser }: UserFilterProps) => {
  const { data, error, isError, isLoading } = useGetUsers();

  const users = useMemo(() => {
    if (data) {
      return data.users;
    }
    return [];
  }, [data]);

  if (isError) {
    return <Typography color="error">{error?.error}</Typography>;
  }

  return (
    <AutocompleteFilter
      disabled={isLoading}
      getOptionLabel={(value: UserSummary) => value.username}
      id="datasets-user-filter"
      label="Filter by owner"
      options={users}
      value={user}
      onChange={setUser}
    />
  );
};
