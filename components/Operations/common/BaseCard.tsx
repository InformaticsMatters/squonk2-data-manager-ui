import React, { FC, ReactNode, useState } from 'react';

import { css } from '@emotion/react';
import { Card, CardActions, CardContent, Collapse, IconButton, useTheme } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface BaseCardProps {
  collapsed: ReactNode;
  actions?: ReactNode;
}

export const BaseCard: FC<BaseCardProps> = ({ children, collapsed, actions }) => {
  const [expanded, setExpanded] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);

  const theme = useTheme();

  return (
    <Card>
      <CardContent>{children}</CardContent>
      <CardActions disableSpacing>
        {actions}
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
      </CardActions>
      <Collapse in={expanded}>
        <CardContent>{hasExpanded ? collapsed : null}</CardContent>
      </Collapse>
    </Card>
  );
};
