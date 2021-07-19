import React, { FC, ReactNode, useState } from 'react';

import { css } from '@emotion/react';
import { Card, CardActions, CardContent, Collapse, IconButton, useTheme } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface BaseCardProps {
  collapsed: ReactNode;
  actions?: ReactNode;
  collapsedByDefault?: boolean;
}

export const BaseCard: FC<BaseCardProps> = ({
  children,
  collapsed,
  actions,
  collapsedByDefault = true,
}) => {
  const [expanded, setExpanded] = useState(!collapsedByDefault);
  const [hasExpanded, setHasExpanded] = useState(!collapsedByDefault);

  const theme = useTheme();

  return (
    <Card>
      <CardContent>{children}</CardContent>
      <CardActions disableSpacing>
        {actions}
        {collapsedByDefault && (
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
      <Collapse in={expanded}>
        <CardContent>{hasExpanded ? collapsed : null}</CardContent>
      </Collapse>
    </Card>
  );
};
