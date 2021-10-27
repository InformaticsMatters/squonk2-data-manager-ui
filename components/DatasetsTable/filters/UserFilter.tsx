import type { Error as DMError, UsersGetResponse, UserSummary } from '@squonk/data-manager-client';
import { useGetUsers } from '@squonk/data-manager-client/user';

import { Typography } from '@material-ui/core';
import type { AxiosError } from 'axios';

import { AutocompleteFilter } from './AutocompleteFilter';

export interface UserFilterProps {
  /**
   * Selected user.
   */
  user?: UserSummary;
  /**
   * Function to set selected user.
   */
  setUser: (user?: UserSummary) => void;
  /**
   * ID of the filter.
   */
  id?: string;
  /**
   * Label which displays filter's functionality.
   */
  label: string;
}

/**
 * Component which adjusts filtering of datasets according to user. Used as a base for owner and
 * editor filters.
 */
export const UserFilter = ({ user, setUser, id, label }: UserFilterProps) => {
  const { data, error, isError, isLoading } = useGetUsers<
    UsersGetResponse,
    AxiosError<DMError> | void
  >();

  const users = data?.users || [];

  if (isError) {
    return <Typography color="error">{error?.message}</Typography>;
  }

  return (
    <AutocompleteFilter
      error={error}
      getOptionLabel={(value: UserSummary) => value.username}
      id={id}
      isError={isError}
      isLoading={isLoading}
      label={label}
      options={users}
      value={user}
      onChange={setUser}
    />
  );
};
