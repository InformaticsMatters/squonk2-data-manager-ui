import type { Dispatch, FC, ReactNode, SetStateAction } from "react";
import { useState } from "react";

import { CardContent, ListItem, ListItemIcon, ListItemText, Slide } from "@mui/material";
import type { LinkProps } from "next/link";

import type { ActionsParams, BaseCardProps } from "../BaseCard";
import { BaseCard } from "../BaseCard";
import { HorizontalList } from "../HorizontalList";
import { NextLink } from "../NextLink";
import type { DateTimeListItemProps } from "./DateTimeListItem/DateTimeListItem";
import { DateTimeListItem } from "./DateTimeListItem/DateTimeListItem";
import type { StatusIconProps } from "./StatusIcon";
import { StatusIcon } from "./StatusIcon";

export interface ResultCardProps extends Omit<BaseCardProps, "actions"> {
  /**
   * Current state (task or instance state) of the result
   */
  state?: StatusIconProps["state"];
  href: LinkProps["href"];
  linkTitle: string;
  createdDateTime: DateTimeListItemProps["startTimestamp"];
  finishedDateTime?: DateTimeListItemProps["endTimestamp"];
  /**
   * Whether the duration of the result should be displayed
   */
  showDuration?: DateTimeListItemProps["showDuration"];
  collapsedByDefault: boolean;
  actions: (
    params: { slideIn: boolean; setSlideIn: Dispatch<SetStateAction<boolean>> } & ActionsParams,
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
}) => {
  const [slideIn, setSlideIn] = useState(true);

  return (
    <Slide appear={false} direction="right" in={slideIn}>
      <div>
        <BaseCard
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
                  <NextLink component="a" href={href}>
                    {linkTitle}
                  </NextLink>
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
