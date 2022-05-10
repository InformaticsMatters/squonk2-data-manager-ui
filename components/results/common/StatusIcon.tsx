import type {
  InstanceGetResponsePhase,
  TaskSummaryProcessingStage,
} from '@squonk/data-manager-client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import { green, yellow } from '@mui/material/colors';

export interface StatusIconProps {
  /**
   * Task or Instance status
   */
  state?: TaskSummaryProcessingStage | InstanceGetResponsePhase;
}

/**
 * SVG Icons for each instance / task status
 */
export const StatusIcon = ({ state }: StatusIconProps) => {
  switch (state) {
    case 'COPYING':
    case 'FORMATTING':
    case 'LOADING':
    case 'DELETING':
    case 'RUNNING':
    case 'PENDING':
      return <FiberManualRecordRoundedIcon htmlColor={yellow[800]} />;
    case 'DONE':
    case 'COMPLETED':
    case 'SUCCEEDED':
      return <CheckCircleRoundedIcon htmlColor={green[800]} />;
    case 'FAILED':
      return <ErrorRoundedIcon color="error" />;
    default:
      return <FiberManualRecordRoundedIcon />;
  }
};
