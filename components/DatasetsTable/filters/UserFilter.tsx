import type { UserSummary } from "@squonk/data-manager-client";
import { useGetUsers } from "@squonk/data-manager-client/user";

import { Typography } from "@mui/material";

import { getErrorMessage } from "../../../utils/orvalError";
import { AutocompleteFilter } from "./AutocompleteFilter";

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
  const { data, error, isError, isLoading } = useGetUsers();

  const users = data?.users || [];

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <AutocompleteFilter
      error={getErrorMessage(error)}
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
