import type { Error as DataManagerError } from '@squonk/data-manager-client';

import { TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import { filterSize } from './constants';

export interface AutocompleteFilterProps<T> {
  /**
   * ID of the filter.
   */
  id?: string;
  /**
   * Label which displays filter's functionality.
   */
  label: string;
  /**
   * Selected filter value.
   */
  value?: T;
  /**
   * Options that are displayed to the user.
   */
  options: T[];
  /**
   * Maps selected value into string, which is displayed to the user.
   */
  getOptionLabel: (value: T) => string;
  /**
   * Callback when an option is selected or cleared.
   */
  onChange: (value?: T) => void;
  /**
   * Whether provided 'options' are still loading.
   */
  isLoading: boolean;
  /**
   * Whether there was an error while fetching 'options'.
   */
  isError: boolean;
  /**
   * Error encountered while fetching 'options'.
   */
  error?: void | DataManagerError | null;
}

/**
 * Base component for other autocomplete filters.
 */
export const AutocompleteFilter = <T extends unknown>({
  id,
  label,
  value,
  options,
  getOptionLabel,
  onChange,
  isLoading,
  isError,
  error,
}: AutocompleteFilterProps<T>) => {
  if (isError) {
    return <Typography color="error">{error?.error}</Typography>;
  }

  return (
    <Autocomplete
      autoHighlight
      disabled={isLoading}
      getOptionLabel={getOptionLabel}
      id={id}
      options={options}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            autoComplete: 'off', // Disable autocomplete and autofill
          }}
          label={label}
          variant="outlined"
        />
      )}
      style={{ width: filterSize }}
      value={value || null} // Prevents making the component uncontrolled
      // If no option is selected, Autocomplete returns null which we transform to undefined
      onChange={(event, value) => onChange(value || undefined)}
    />
  );
};
