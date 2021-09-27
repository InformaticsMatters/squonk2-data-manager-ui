import type { InstanceSummaryState, TaskSummaryProcessingStage } from '@squonk/data-manager-client';

import { amber, green, yellow } from '@material-ui/core/colors';
import CheckCircleRoundedIcon from '@material-ui/icons/CheckCircleRounded';
import ErrorRoundedIcon from '@material-ui/icons/ErrorRounded';
import FiberManualRecordRoundedIcon from '@material-ui/icons/FiberManualRecordRounded';

export interface StatusIconProps {
  /**
   * Task or Instance status
   */
  state: InstanceSummaryState | TaskSummaryProcessingStage;
}

/**
 * SVG Icons for each instance / task status
 */
export const StatusIcon = ({ state }: StatusIconProps) => {
  switch (state) {
    case 'PENDING':
      return <FiberManualRecordRoundedIcon htmlColor={amber[800]} />;
    case 'STARTED':
    case 'FORMATTING':
      return <FiberManualRecordRoundedIcon htmlColor={yellow[800]} />;
    case 'SUCCESS':
    case 'DONE':
      return <CheckCircleRoundedIcon htmlColor={green[800]} />;
    case 'FAILURE':
    case 'FAILED':
      return <ErrorRoundedIcon color="error" />;
    default:
      return <FiberManualRecordRoundedIcon />;
  }
};
