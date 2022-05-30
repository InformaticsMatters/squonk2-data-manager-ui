import type { Dispatch, FC, ReactNode, SetStateAction } from "react";
import { useState } from "react";

import { CardContent, Link, ListItem, ListItemIcon, ListItemText, Slide } from "@mui/material";
import type { LinkProps } from "next/link";
import NextLink from "next/link";

import type { ActionsParams, BaseCardProps } from "../BaseCard";
import { BaseCard } from "../BaseCard";
import type { DateTimeListItemProps } from "./common/DateTimeListItem";
import { DateTimeListItem } from "./common/DateTimeListItem";
import { HorizontalList } from "./common/HorizontalList";
import type { StatusIconProps } from "./common/StatusIcon";
import { StatusIcon } from "./common/StatusIcon";

export interface ResultCardProps extends BaseCardProps {
  state?: StatusIconProps["state"];
  href: LinkProps["href"];
  linkTitle: string;
  createdDateTime: DateTimeListItemProps["datetimeString"];
  collapsedByDefault: boolean;
  actions: (
    params: ActionsParams & { setSlideIn: Dispatch<SetStateAction<boolean>>; slideIn: boolean },
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
    <Slide direction="right" in={slideIn}>
      <div>
        <BaseCard
          actions={(params) => actions({ ...params, slideIn, setSlideIn })}
          collapsed={<CardContent>{collapsed}</CardContent>}
          collapsedByDefault={collapsedByDefault}
        >
          <HorizontalList>
            <ListItem>
              <ListItemIcon>
                <StatusIcon state={state} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <NextLink passHref href={href}>
                    <Link>{linkTitle}</Link>
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
