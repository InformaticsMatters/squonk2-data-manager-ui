import { useLayoutEffect, useMemo, useState } from 'react';

import { css } from '@emotion/react';
import { debounce, TextField } from '@material-ui/core';

import { filterSize } from './constants';

export interface LabelFilterProps {
  /**
   * Current label as string (what user typed).
   */
  label: string;
  /**
   * Function to set label.
   */
  setLabel: (label: string) => void;
}

/**
 * Component which adjusts filtering of datasets according to label.
 */
export const LabelFilter = ({ label, setLabel }: LabelFilterProps) => {
  // Since we are using debounce, value in the 'label' does not update in real time.
  // That is why we use this state variable which displays the provided text in real time.
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

  // In case the 'label' variable gets updated elsewhere, keep the 'displayLabel' in sync.
  // useLayoutEffect is used to prevent displaying the stale 'displayLabel' value.
  useLayoutEffect(() => {
    setDisplayLabel(label);
  }, [label]);

  return (
    <TextField
      css={css`
        width: ${filterSize}px;
      `}
      id="datasets-label-filter"
      inputProps={{
        autoComplete: 'off', // Disable autocomplete and autofill
      }}
      label="Filter by label"
      value={displayLabel}
      variant="outlined"
      onChange={onDisplayValueChange}
    />
  );
};
