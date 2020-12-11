import React from 'react';

import { Checkbox, Chip, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';

interface IProps {
  helperText?: string;
  options: string[];
  labels: string[];
  setLabels: (newLabels: string[]) => void;
}

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
  return (
    <Autocomplete
      disableCloseOnSelect
      size="small"
      multiple
      options={Array.from(new Set([...options, ...labels]))}
      freeSolo
      handleHomeEndKeys
      onChange={(_, newValue) => {
        setLabels(newValue);
      }}
      defaultValue={labels}
      renderTags={(value: string[], getTagProps) =>
        value.map((option: string, index: number) => (
          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
        ))
      }
      renderInput={(params) => <TextField {...params} variant="outlined" label={helperText} />}
      renderOption={(option, { selected }) => {
        // Custom render option to make the 'add new label' option displayed differently
        return (
          <>
            <Checkbox size="small" style={{ marginRight: 8 }} checked={selected} />
            {option}
          </>
        );
      }}
    />
  );
};

export default LabelSelector;
