import type { FC } from 'react';

import type { InstanceSummaryState, TaskSummaryProcessingStage } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { amber, green, yellow } from '@material-ui/core/colors';
import CheckCircleRoundedIcon from '@material-ui/icons/CheckCircleRounded';
import ErrorRoundedIcon from '@material-ui/icons/ErrorRounded';
import FiberManualRecordRoundedIcon from '@material-ui/icons/FiberManualRecordRounded';

interface StatusIconProps {
  state: InstanceSummaryState | TaskSummaryProcessingStage;
}

export const StatusIcon: FC<StatusIconProps> = ({ state }) => {
  const style = css`
    /* margin-bottom: -5px; */
  `;
  switch (state) {
    case 'PENDING':
      return <FiberManualRecordRoundedIcon css={style} htmlColor={amber[800]} />;
    case 'STARTED':
    case 'FORMATTING':
      return <FiberManualRecordRoundedIcon css={style} htmlColor={yellow[800]} />;
    case 'SUCCESS':
    case 'DONE':
      return <CheckCircleRoundedIcon css={style} htmlColor={green[800]} />;
    case 'FAILURE':
    case 'FAILED':
      return <ErrorRoundedIcon color="error" css={style} />;
    default:
      return <FiberManualRecordRoundedIcon css={style} />;
  }
};
