import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

export interface AutocompleteFilterProps<T> {
  id?: string;
  label: string;
  value?: T;
  options: T[];
  getOptionLabel: (value: T) => string;
  onChange: (value?: T) => void;
  disabled?: boolean;
}

export const AutocompleteFilter = <T extends unknown>({
  id,
  label,
  value,
  options,
  getOptionLabel,
  onChange,
  disabled,
}: AutocompleteFilterProps<T>) => {
  return (
    <Autocomplete
      autoHighlight
      disabled={disabled}
      getOptionLabel={getOptionLabel}
      id={id}
      options={options}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            autoComplete: 'new-password', // disable autocomplete and autofill
          }}
          label={label}
          variant="outlined"
        />
      )}
      style={{ width: 200 }}
      value={value}
      onChange={(event, value) => onChange(value ? value : undefined)}
    />
  );
};
