import React, { FC } from 'react';

import { css } from '@emotion/react';
import { Avatar, Card, CardActions, CardContent, CardHeader } from '@material-ui/core';

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
  title,
  subtitle,
  color,
}) => {
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
          justify-content: right;
        `}
      >
        {actions}
      </CardActions>
    </Card>
  );
};
