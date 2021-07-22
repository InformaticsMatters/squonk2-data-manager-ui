import type { FC } from 'react';
import React, { useState } from 'react';

import { css } from '@emotion/react';
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  useTheme,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface BaseCardProps {
  actions: React.ReactNode;
  collapsed?: React.ReactNode;
  cardType: string;
  title?: string;
  subtitle?: string;
  color?: string;
}

export const BaseCard: FC<BaseCardProps> = ({
  children,
  actions,
  collapsed,
  cardType,
  title,
  subtitle,
  color,
}) => {
  const [hasExpanded, setHasExpanded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const theme = useTheme();

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
        {collapsed !== undefined && (
          <IconButton
            aria-expanded={expanded}
            css={css`
              margin-left: auto;
              transform: rotate(${expanded ? 180 : 0}deg);
              /* transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; */
              transition: ${theme.transitions.create('transform', {
                duration: theme.transitions.duration.shortest,
              })};
            `}
            onClick={() => {
              setExpanded(!expanded);
              setHasExpanded(true);
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        )}
      </CardActions>
      <Collapse in={expanded}>{hasExpanded ? collapsed : null}</Collapse>
    </Card>
  );
};
