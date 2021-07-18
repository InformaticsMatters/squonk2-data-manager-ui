import React, { FC, ReactNode, useState } from 'react';

import { css } from '@emotion/react';
import { Card, CardActions, CardContent, Collapse, IconButton } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface BaseCardProps {
  collapsed: ReactNode;
  actions?: ReactNode;
}

export const BaseCard: FC<BaseCardProps> = ({ children, collapsed, actions }) => {
  const [expanded, setExpanded] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);

  return (
    <Card>
      <CardContent>{children}</CardContent>
      <CardActions disableSpacing>
        {actions}
        <IconButton
          css={css`
            margin-left: auto;
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
