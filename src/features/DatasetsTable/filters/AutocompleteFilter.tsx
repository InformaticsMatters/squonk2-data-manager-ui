import { Autocomplete, TextField, Typography } from "@mui/material";

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
  error?: string;
}

/**
 * Base component for other autocomplete filters.
 */
export const AutocompleteFilter = <T,>({
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
    return <Typography color="error">{error}</Typography>;
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
          label={label}
          slotProps={{
            htmlInput: {
              ...params.inputProps,
              autoComplete: "off", // Disable autocomplete and autofill
            },
          }}
          variant="outlined"
        />
      )}
      style={{ width: "100%" }}
      value={value ?? null} // Prevents making the component uncontrolled
      // If no option is selected, Autocomplete returns null which we transform to undefined
      onChange={(event, value) => onChange(value ?? undefined)}
    />
  );
};
