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

interface ActionsParams {
  setExpanded: (isExpanded: boolean) => void;
}

interface BaseCardProps {
  actions?: React.ReactNode | ((actionsParams: ActionsParams) => React.ReactNode);
  collapsed?: React.ReactNode;
  collapsedByDefault?: boolean;
  header?: {
    title: string;
    subtitle?: string;
    avatar?: string;
    color?: string;
  };
}

export const BaseCard: FC<BaseCardProps> = ({
  children,
  actions,
  header,
  collapsed,
  collapsedByDefault = true,
}) => {
  const [hasExpanded, setHasExpanded] = useState(!collapsedByDefault);
  const [expanded, setExpanded] = useState(!collapsedByDefault);

  const theme = useTheme();

  return (
    <Card>
      {header && (
        <CardHeader
          avatar={
            <Avatar
              css={
                header.color
                  ? css`
                      background-color: ${header.color};
                    `
                  : undefined
              }
            >
              {header.avatar?.[0].toUpperCase()}
            </Avatar>
          }
          subheader={header.subtitle}
          subheaderTypographyProps={{ variant: 'subtitle1' }}
          title={header.title}
          titleTypographyProps={{ variant: 'body1' }}
        />
      )}
      <CardContent>{children}</CardContent>
      <CardActions
        disableSpacing
        css={css`
          justify-content: right;
        `}
      >
        {typeof actions === 'function' ? actions({ setExpanded }) : actions}
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
      <Collapse in={expanded}>{expanded || hasExpanded ? collapsed : null}</Collapse>
    </Card>
  );
};
