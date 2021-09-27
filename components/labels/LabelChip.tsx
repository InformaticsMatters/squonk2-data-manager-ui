import React from 'react';

import type { ChipProps } from '@material-ui/core';
import { Chip } from '@material-ui/core';

import { labelFormatter } from '../../utils/labelUtils';

export interface LabelChipProps extends ChipProps {
  /**
   * The key of the label. Displayed on the left-hand side of the `=`.
   */
  label: string;
  /**
   * Determines the text displayed on the right-hand side of the `=`.
   * See the docs for './utils/labelUtils'
   */
  values: string | string[];
}

/**
 * Wrapped MuiChip component that takes a label and values prop and formats these in the label
 * format
 */
export const LabelChip = ({ label, values, ...ChipProps }: LabelChipProps) => {
  return (
    <Chip {...ChipProps} label={labelFormatter(label, values)} size="small" variant="outlined" />
  );
};
