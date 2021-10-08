import { useMemo } from 'react';

import { useGetUsers } from '@squonk/data-manager-client/user';

import { TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

export interface UserFilterProps {
  value?: string;
  onChange: (value: string | null) => void;
}

export const UserFilter = ({ value, onChange }: UserFilterProps) => {
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
    <Autocomplete
      autoHighlight
      disabled={isLoading}
      id="dataset-user-filter"
      options={usernames}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            autoComplete: 'new-password', // disable autocomplete and autofill
          }}
          label="Filter by owner"
          variant="outlined"
        />
      )}
      style={{ width: 200 }}
      value={value || null} // ensure the component remains controlled
      onChange={(event, value) => onChange(value)}
    />
  );
};
