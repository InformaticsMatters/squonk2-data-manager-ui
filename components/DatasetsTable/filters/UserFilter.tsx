import { useMemo } from 'react';

import { useGetUsers } from '@squonk/data-manager-client/user';

import { Typography } from '@material-ui/core';

import { AutocompleteFilter } from './AutocompleteFilter';

export interface UserFilterProps {
  value?: string;
  onChange: (value: string | null) => void;
}

export const UserFilter = (props: UserFilterProps) => {
  const { data, error, isError, isLoading } = useGetUsers();

  const usernames = useMemo(() => {
    if (data) {
      return data.users.map((user) => user.username);
    }
    return [];
  }, [data]);

  if (isError) {
    return <Typography color="error">{error?.error}</Typography>;
  }

  return (
    <AutocompleteFilter
      disabled={isLoading}
      id="dataset-user-filter"
      label="Filter by owner"
      options={usernames}
      {...props}
    />
  );
};
