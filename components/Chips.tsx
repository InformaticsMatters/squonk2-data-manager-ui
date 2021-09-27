import type { FC } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import { useTheme } from '@material-ui/core';

export interface ChipsProps {
  /**
   * Spacing in theme units for the gap between labels. Defaults to 0.5 == 4px.
   */
  spacing?: number;
}

/**
 * Wrapper component that provides spacing to one or more Material-UI <Chip /> components
 */
export const Chips: FC<ChipsProps> = ({ children, spacing = 0.5 }) => {
  const theme = useTheme();
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        & > * {
          margin: ${theme.spacing(spacing)}px;
        }
      `}
    >
      {children}
    </div>
  );
};
