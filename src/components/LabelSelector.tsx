import React, { useState } from 'react';

import { TextField } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';

interface IProps {
  helperText?: string;
  options: string[];
  labels: string[];
  setLabels: (newLabels: string[]) => void;
}

const filter = createFilterOptions<string>();

/**
 * Multiselect, creatable combobox for selecting label elements.
 * This is a controlled component so you need to provide the state as props.
 * @param helperText the text displayed in the input label
 * @param options the default options that the user can pick from
 * @param labels the value of the input. The value of your useState
 * @param setLabels the setter for the value input. Called when a selection is made.
 * The setter from your useState.
 */
const LabelSelector: React.FC<IProps> = ({
  helperText = 'Add labels',
  options,
  labels,
  setLabels,
}) => {
  const [addedOptions, setAddedOptions] = useState<string[]>([]);

  // Set trick to remove duplicate entries
  const displayOptions = Array.from(new Set([...options, ...addedOptions]));
  return (
    <Autocomplete
      disableCloseOnSelect
      value={labels}
      onChange={(_, newValue) => {
        const additions = newValue.filter((value) => !displayOptions.includes(value));
        setAddedOptions([...addedOptions, ...additions]);
        setLabels(newValue);
      }}
      multiple
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        // Only create an add new label option if it doesn't exist already and isn't empty
        if (params.inputValue !== '' && !displayOptions.includes(params.inputValue)) {
          filtered.push(params.inputValue);
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="size-small-outlined-multi"
      size="small"
      options={displayOptions}
      renderInput={(params) => <TextField {...params} variant="outlined" label={helperText} />}
    />
  );
};

export default LabelSelector;
