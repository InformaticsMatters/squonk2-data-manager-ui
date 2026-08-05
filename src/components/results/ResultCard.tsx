import { type Dispatch, type FC, type ReactNode, type SetStateAction, useState } from "react";

import { CardContent, Link, ListItem, ListItemIcon, ListItemText, Slide } from "@mui/material";
import NextJsLink from "next/link";

import { type ActionsParams, BaseCard, type BaseCardProps } from "../BaseCard";
import { HorizontalList } from "../HorizontalList";
import { DateTimeListItem, type DateTimeListItemProps } from "./DateTimeListItem/DateTimeListItem";
import { StatusIcon, type StatusIconProps } from "./StatusIcon";

export interface ResultCardProps extends Omit<BaseCardProps, "actions"> {
  /**
   * Current state (task or instance state) of the result
   */
  state?: StatusIconProps["state"];
  /** Canonical route of this result inside the project that owns it. */
  href: string;
  linkTitle: string;
  createdDateTime: DateTimeListItemProps["startTimestamp"];
  finishedDateTime?: DateTimeListItemProps["endTimestamp"];
  /**
   * Whether the duration of the result should be displayed
   */
  showDuration?: DateTimeListItemProps["showDuration"];
  collapsedByDefault: boolean;
  actions: (
    params: ActionsParams & { slideIn: boolean; setSlideIn: Dispatch<SetStateAction<boolean>> },
  ) => ReactNode;
}

/**
 * Wrapper around BaseCard used to fix some shared functionality for Job-, App- and Task-cards
 */
export const ResultCard: FC<ResultCardProps> = ({
  state,
  href,
  linkTitle,
  actions,
  createdDateTime,
  finishedDateTime,
  showDuration = true,
  collapsedByDefault = true,
  collapsed,
  children,
  accentColor,
}) => {
  const [slideIn, setSlideIn] = useState(true);

  return (
    <Slide appear={false} direction="right" in={slideIn}>
      <div>
        <BaseCard
          accentColor={accentColor}
          actions={(params) => actions({ ...params, slideIn, setSlideIn })}
          collapsed={<CardContent>{collapsed}</CardContent>}
          collapsedByDefault={collapsedByDefault}
          keepCollapsedMounted={false}
        >
          <HorizontalList>
            <ListItem>
              <ListItemIcon>
                <StatusIcon state={state} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Link component={NextJsLink} href={href as never}>
                    {linkTitle}
                  </Link>
                }
                secondary={state}
              />
            </ListItem>
            {children}
            <DateTimeListItem
              endTimestamp={finishedDateTime}
              showDuration={showDuration}
              startTimestamp={createdDateTime}
            />
          </HorizontalList>
        </BaseCard>
      </div>
    </Slide>
  );
};
