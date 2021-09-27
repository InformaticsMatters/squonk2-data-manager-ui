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

/**
 * Parameters passed to actions when a component is passed
 * {@label ActionsParams}
 */
interface ActionsParams {
  setExpanded: (isExpanded: boolean) => void;
}

export interface BaseCardProps {
  /**
   * ReactNode or Component to render in the <CardActions> component. Optional - nothing is
   * displayed if not passed.
   *
   * If a component is passed, {@link ActionsParams} is provided as render props.
   *
   * {@label actions}
   */
  actions?: React.ReactNode | ((actionsParams: ActionsParams) => React.ReactNode);
  /**
   * ReactNode to be rendered inside the collapsed part of the card. Optional - nothing is
   * displayed if not passed.
   */
  collapsed?: React.ReactNode;
  /**
   * Whether the card is collapsed by default. Optional. Defaults to `true`.
   */
  collapsedByDefault?: boolean;
  /**
   * String values to be displayed in the header section of the card. Only title is required.
   * Missing values are not displayed.
   */
  header?: {
    title: string;
    subtitle?: string;
    avatar?: string;
    color?: string;
  };
}

/**
 * Generic card component with actions and an expanded view.
 *
 * Includes:
 * * a header including an icon (MuiAvatar)
 * * optional actions that are always displayed - {@link actions}
 * * an optional collapsed view that can be enabled by default
 * * children are passed into the main area (unexpanded view) of the component
 */
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
        {/* ? should this be a functionCall() or a <ReactElement />
        or should this be separate props with a union and one a never type */}
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
