import { type Dispatch, type ReactNode, type SetStateAction, useState } from "react";

import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
} from "@mui/material";

/**
 * Parameters passed to actions when a component is passed
 * {@label ActionsParams}
 */
export interface ActionsParams {
  [key: string]: unknown;
  setExpanded: Dispatch<SetStateAction<boolean>>;
}

export interface BaseCardProps {
  children?: ReactNode;
  /**
   * ReactNode or Component to render in the <CardActions> component. Optional - nothing is
   * displayed if not passed.
   *
   * If a component is passed, {@link ActionsParams} is provided as render props.
   *
   * {@label actions}
   */
  actions?: ReactNode | ((actionsParams: ActionsParams) => ReactNode);
  /**
   * ReactNode to be rendered inside the collapsed part of the card. Optional - nothing is
   * displayed if not passed.
   */
  collapsed?: ReactNode;
  /**
   * Whether the card is collapsed by default. Optional. Defaults to `true`.
   */
  collapsedByDefault?: boolean;
  /**
   * Whether to unmount the collapsed content mounted after the first time it is expanded
   */
  keepCollapsedMounted?: boolean;
  /**
   * String values to be displayed in the header section of the card. Only title is required.
   * Missing values are not displayed.
   */
  header?: { title: string; subtitle?: string; avatar?: string };
  /**
   * Color for the avatar background and top border
   */
  accentColor?: string;
}

/**
 * Generic card component with actions and an expanded view.
 *
 * Includes:
 * * a header including an icon (MuiAvatar)
 * * optional actions that are always displayed - {@link actions}
 * * an optional collapsed view that can be enabled by default
 * * children are passed into the main area (unexpanded view) of the component
 * * coloured top border using the header color
 */
export const BaseCard = ({
  children,
  actions,
  header,
  collapsed,
  keepCollapsedMounted = true,
  collapsedByDefault = true,
  accentColor,
}: BaseCardProps) => {
  const [hasExpanded, setHasExpanded] = useState(!collapsedByDefault);
  const [expanded, setExpanded] = useState(!collapsedByDefault);

  return (
    <Card sx={{ borderTop: accentColor ? "3px solid" : "none", borderTopColor: accentColor }}>
      {!!header && (
        <CardHeader
          avatar={
            <Avatar sx={{ fontFamily: "verdana", backgroundColor: accentColor ?? "transparent" }}>
              {header.avatar?.[0].toUpperCase()}
            </Avatar>
          }
          slotProps={{ subheader: { variant: "subtitle1" }, title: { variant: "body1" } }}
          subheader={header.subtitle}
          title={header.title}
        />
      )}
      <CardContent>{children}</CardContent>
      <CardActions
        disableSpacing
        // A card is only as wide as its grid track, so the actions row wraps rather than pushing
        // its controls — and anything stated beside them — out over the card's own edges.
        sx={{
          justifyContent: "right",
          display: "flex",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {/* ? should this be a functionCall() or a <ReactElement />
        or should this be separate props with a union and one a never type */}
        {typeof actions === "function" ? actions({ setExpanded }) : actions}
        {collapsed !== undefined && (
          <IconButton
            // The control is an icon alone, so it says what it does rather than leaving a caller
            // who cannot see the arrow with an unnamed button.
            aria-expanded={expanded}
            aria-label={expanded ? "Show less" : "Show more"}
            sx={(theme) => ({
              marginLeft: "auto",
              transform: `rotate(${expanded ? 180 : 0}deg)`,
              transition: theme.transitions.create("transform", {
                duration: theme.transitions.duration.shortest,
              }),
            })}
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
        {expanded || (keepCollapsedMounted && hasExpanded) ? collapsed : null}
      </Collapse>
    </Card>
  );
};
