import { type FC } from "react";

import {
  DeleteRounded as DeleteRoundedIcon,
  DoneRounded as DoneRoundedIcon,
} from "@mui/icons-material";
import { keyframes } from "@mui/material/styles";

export interface TwiddleIconProps {
  done: boolean;
}

const spin = keyframes`
  0% {
    opacity: 0.4;
    transform: rotate(-45deg);
  }
  100% {
    opacity: 1;
    transform: rotate(0);
  }
`;

export const TwiddleIcon: FC<TwiddleIconProps> = ({ done }) => {
  return done ? (
    <DoneRoundedIcon sx={{ animation: `${spin} 0.5s ease` }} />
  ) : (
    <DeleteRoundedIcon color="primary" />
  );
};
