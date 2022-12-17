import type { Dispatch, FC, ReactNode, SetStateAction } from "react";
import { useState } from "react";

import { CardContent, ListItem, ListItemIcon, ListItemText, Slide } from "@mui/material";
import type { LinkProps } from "next/link";
import type { Route } from "nextjs-routes";

import type { ActionsParams, BaseCardProps } from "../BaseCard";
import { BaseCard } from "../BaseCard";
import { HorizontalList } from "../HorizontalList";
import { NextLink } from "../NextLink";
import type { DateTimeListItemProps } from "./DateTimeListItem";
import { DateTimeListItem } from "./DateTimeListItem";
import type { StatusIconProps } from "./StatusIcon";
import { StatusIcon } from "./StatusIcon";

export interface ResultCardProps extends Omit<BaseCardProps, "actions"> {
  state?: StatusIconProps["state"];
  href: LinkProps<Route>["href"];
  linkTitle: string;
  createdDateTime: DateTimeListItemProps["datetimeString"];
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
            <DateTimeListItem datetimeString={createdDateTime} />
          </HorizontalList>
        </BaseCard>
      </div>
    </Slide>
  );
};
