import React from 'react';

import { TextField } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';

interface IProps {
  options: string[];
  labels: string[];
  setLabels: (newLabels: string[]) => void;
}

const filter = createFilterOptions<string>();

const LabelSelector: React.FC<IProps> = ({ options, labels, setLabels }) => {
  return (
    <Autocomplete
      value={labels}
      onChange={(_, newValue) => {
        setLabels(newValue);
      }}
      multiple
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        if (params.inputValue !== '') {
          filtered.push(params.inputValue);
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="size-small-outlined-multi"
      size="small"
      options={options}
      renderInput={(params) => <TextField {...params} variant="outlined" label="Add labels" />}
    />
  );
};

export default LabelSelector;
