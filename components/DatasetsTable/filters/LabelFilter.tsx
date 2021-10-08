import { useLayoutEffect, useMemo, useState } from 'react';

import { debounce, TextField } from '@material-ui/core';

export interface LabelFilterProps {
  label: string;
  setLabel: (label: string) => void;
}

export const LabelFilter = ({ label, setLabel }: LabelFilterProps) => {
  const [displayLabel, setDisplayLabel] = useState(label);

  const onChangeDebounced = useMemo(() => {
    return debounce((lbl: typeof displayLabel) => {
      setLabel(lbl);
    }, 500);
  }, [setLabel]);

  const onDisplayValueChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const val = event.target.value;
    setDisplayLabel(val);
    onChangeDebounced(val);
  };

  useLayoutEffect(() => {
    setDisplayLabel(label);
  }, [label]);

  return (
    <TextField
      id="datasets-label-filter"
      inputProps={{
        autoComplete: 'new-password', // disable autocomplete and autofill
      }}
      label="Filter by label"
      value={displayLabel}
      variant="outlined"
      onChange={onDisplayValueChange}
    />
  );
};
