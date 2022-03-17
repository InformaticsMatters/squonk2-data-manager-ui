import type {
  InstanceGetResponsePhase,
  TaskSummaryProcessingStage,
} from '@squonk/data-manager-client';

import { green, yellow } from '@material-ui/core/colors';
import CheckCircleRoundedIcon from '@material-ui/icons/CheckCircleRounded';
import ErrorRoundedIcon from '@material-ui/icons/ErrorRounded';
import FiberManualRecordRoundedIcon from '@material-ui/icons/FiberManualRecordRounded';

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
