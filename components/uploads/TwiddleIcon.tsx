import type { FC } from 'react';

import { css } from '@emotion/react';
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import DoneRoundedIcon from '@material-ui/icons/DoneRounded';

export interface TwiddleIconProps {
  done: boolean;
}

export const TwiddleIcon: FC<TwiddleIconProps> = ({ done }) => {
  return done ? (
    <DoneRoundedIcon
      css={css`
        @keyframes spin-in {
          0% {
            opacity: 0.4;
            transform: rotate(-45deg);
          }
          100% {
            opacity: 1;
            transform: rotate(0);
          }
        }
        animation: spin-in 0.5s ease;
      `}
    />
  ) : (
    <DeleteRoundedIcon color="primary" />
  );
};
