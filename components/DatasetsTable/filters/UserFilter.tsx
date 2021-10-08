import type { UserSummary } from '@squonk/data-manager-client';
import { useGetUsers } from '@squonk/data-manager-client/user';

import { Typography } from '@material-ui/core';

import { AutocompleteFilter } from './AutocompleteFilter';

export interface UserFilterProps {
  /**
   * Selected owner/user.
   */
  user?: UserSummary;
  /**
   * Function to set selected owner/user.
   */
  setUser: (user?: UserSummary) => void;
}

/**
 * Component which adjusts filtering of datasets according to owner/user.
 */
export const UserFilter = ({ user, setUser }: UserFilterProps) => {
  const { data, error, isError, isLoading } = useGetUsers();

  const users = data?.users || [];

  if (isError) {
    return <Typography color="error">{error?.error}</Typography>;
  }

  return (
    <AutocompleteFilter
      error={error}
      getOptionLabel={(value: UserSummary) => value.username}
      id="datasets-user-filter"
      isError={isError}
      isLoading={isLoading}
      label="Filter by owner"
      options={users}
      value={user}
      onChange={setUser}
    />
  );
};
