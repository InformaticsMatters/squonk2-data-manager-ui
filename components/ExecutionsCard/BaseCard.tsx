import React, { FC, useState } from 'react';

import { useGetInstances } from '@squonk/data-manager-client/instance';

import { css } from '@emotion/react';
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Typography,
} from '@material-ui/core';
import ExpandMoreRoundedIcon from '@material-ui/icons/ExpandMoreRounded';

import { InstanceDetail } from './InstanceDetail';

interface BaseCardProps {
  actions: React.ReactNode;
  cardType: string;
  applicationId?: string;
  title?: string;
  subtitle?: string;
  color?: string;
}

export const BaseCard: FC<BaseCardProps> = ({
  children,
  actions,
  cardType,
  applicationId,
  title,
  subtitle,
  color,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { data: instancesData } = useGetInstances();
  const instances = instancesData?.instances.filter(
    (instance) => instance.application_id === applicationId,
  );

  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar
            css={
              color
                ? css`
                    background-color: ${color};
                  `
                : undefined
            }
          >
            {cardType[0].toUpperCase()}
          </Avatar>
        }
        subheader={subtitle}
        title={title}
      />
      <CardContent>{children}</CardContent>
      <CardActions
        disableSpacing
        css={css`
          justify-content: center;
        `}
      >
        {actions}
        <IconButton
          aria-expanded={expanded}
          aria-label={`show ${cardType}s`}
          css={css`
            margin-left: auto;
          `}
          onClick={() => setExpanded(!expanded)}
        >
          <ExpandMoreRoundedIcon />
        </IconButton>
      </CardActions>
      <Collapse unmountOnExit in={expanded} timeout="auto">
        <CardContent>
          <Typography component="h3" variant="subtitle1">
            <b>Running {cardType}s</b>
            {instances?.length ? (
              instances.map((instance) => (
                <InstanceDetail instanceId={instance.instance_id} key={instance.instance_id} />
              ))
            ) : (
              <Typography variant="body2">No Instances Running</Typography>
            )}
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
};
