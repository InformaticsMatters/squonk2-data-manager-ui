import React, { FC, ReactNode, useState } from 'react';

import { css } from '@emotion/react';
import {
  Card,
  CardActions,
  CardContent,
  Collapse,
  IconButton,
  Typography,
  useTheme,
} from '@material-ui/core';
import { green, yellow } from '@material-ui/core/colors';
import CheckCircleRoundedIcon from '@material-ui/icons/CheckCircleRounded';
import ErrorRoundedIcon from '@material-ui/icons/ErrorRounded';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FiberManualRecordRoundedIcon from '@material-ui/icons/FiberManualRecordRounded';
import RotateRightRoundedIcon from '@material-ui/icons/RotateRightRounded';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@material-ui/lab';
import { useGetTask } from '@squonk/data-manager-client';

interface TaskProps {
  taskId: string;
}

export const Task: FC<TaskProps> = ({ taskId }) => {
  const theme = useTheme();
  const { data: task } = useGetTask(taskId);

  const latestState = task?.states[task.states.length - 1];

  const [expanded, setExpanded] = useState(false);

  if (latestState) {
    let icon: ReactNode;
    switch (latestState.state) {
      case 'PENDING':
        icon = <FiberManualRecordRoundedIcon />;
        break;
      case 'STARTED':
        icon = <FiberManualRecordRoundedIcon htmlColor={yellow[800]} />;
        break;
      case 'RETRY':
        icon = <RotateRightRoundedIcon />;
        break;
      case 'SUCCESS':
        icon = <CheckCircleRoundedIcon htmlColor={green[800]} />;
        break;
      case 'FAILURE':
        icon = <ErrorRoundedIcon color="error" />;
        break;
    }

    return (
      <Card>
        <CardContent>
          <Typography
            css={css`
              display: flex;
              align-items: center;
              gap: ${theme.spacing(1)}px;
            `}
          >
            {icon} {latestState.state} • {(task as any)?.purpose}
            <span
              css={css`
                margin-left: auto;
              `}
            >
              {latestState.time}
            </span>
          </Typography>

          {/* {JSON.stringify(task)} */}
        </CardContent>
        <CardActions disableSpacing>
          <IconButton
            disabled={!task?.events.length}
            css={css`
              margin-left: auto;
            `}
            onClick={() => setExpanded(!expanded)}
          >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
        <Collapse in={expanded}>
          <CardContent>
            <Timeline>
              {task?.events.map((event, index) => (
                <TimelineItem key={event.ordinal}>
                  <TimelineOppositeContent>
                    <Typography color="textSecondary">{event.time}</Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot />
                    {(index + 1 !== task.events.length || !task.done) && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>{event.message}</TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </CardContent>
        </Collapse>
      </Card>
    );
  }

  return null;
};
