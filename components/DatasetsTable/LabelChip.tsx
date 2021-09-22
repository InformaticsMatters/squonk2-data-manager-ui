import type { FC } from 'react';
import React from 'react';

import type { ChipProps } from '@material-ui/core';
import { Chip } from '@material-ui/core';

import { labelFormatter } from '../../utils/labelUtils';

export interface LabelChipProps extends ChipProps {
  label: string;
  values: string | string[];
}

export const LabelChip: FC<LabelChipProps> = ({ label, values, ...ChipProps }) => {
  return (
    <Chip {...ChipProps} label={labelFormatter(label, values)} size="small" variant="outlined" />
  );
};
