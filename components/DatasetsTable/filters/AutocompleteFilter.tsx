import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

export interface AutocompleteFilterProps {
  id?: string;
  label: string;
  options: string[];
  value?: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export const AutocompleteFilter = ({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
}: AutocompleteFilterProps) => {
  return (
    <Autocomplete
      autoHighlight
      disabled={disabled}
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
      value={value || null} // ensure the component remains controlled
      onChange={(event, value) => onChange(value)}
    />
  );
};
