import { type ReactElement } from "react";

import { green, yellow } from "@mui/material/colors";
import { keyframes } from "@mui/material/styles";

import {
  DeletingIcon,
  FailedIcon,
  QueuedIcon,
  RunningIcon,
  StoppedIcon,
  SucceededIcon,
  UnknownIcon,
} from "../icons";
import { type ResultState, type StatusConcept, statusConcept } from "./statusConcept";

export interface StatusIconProps {
  /**
   * Task or Instance status
   */
  state?: ResultState;
}

const spin = keyframes`to { transform: rotate(360deg); }`;

const icons: Record<StatusConcept, ReactElement> = {
  deleting: <DeletingIcon htmlColor={yellow[800]} />,
  failed: <FailedIcon color="error" />,
  queued: <QueuedIcon htmlColor={yellow[800]} />,
  running: (
    <RunningIcon
      htmlColor={yellow[800]}
      sx={{
        animation: `${spin} 2s linear infinite`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    />
  ),
  stopped: <StoppedIcon color="warning" />,
  succeeded: <SucceededIcon htmlColor={green[800]} />,
  unknown: <UnknownIcon />,
};

/**
 * The icon for an instance, task or workflow status.
 */
export const StatusIcon = ({ state }: StatusIconProps) => icons[statusConcept(state)];

/** The icon for a status concept, for progress the API does not report as a result state. */
export const StatusConceptIcon = ({ concept }: { concept: StatusConcept }) => icons[concept];

/** Styles a timeline dot to carry an icon: drawn small and white on the dot's colour. */
export const timelineDotIcon = {
  p: 0.25,
  "& svg": { color: "common.white", fontSize: 14 },
} as const;
