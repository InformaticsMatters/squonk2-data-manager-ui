import React, { FC } from 'react';

import { css } from '@emotion/react';
import { CircularProgress } from '@material-ui/core';

export const CenterLoader = () => {
  return (
    <CircularProgress
      css={css`
        position: relative;
        left: calc(50% - 20px);
      `}
    />
  );
};
