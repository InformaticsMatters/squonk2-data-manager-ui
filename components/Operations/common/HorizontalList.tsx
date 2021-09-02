import type { FC } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import { List, ListItem, ListItemText, useMediaQuery, useTheme } from '@material-ui/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { DATE_FORMAT, TIME_FORMAT } from '../../LocalTime/utils';
dayjs.extend(utc);

export interface HorizontalListProps {
  datetimeString: string;
}

export const HorizontalList: FC<HorizontalListProps> = ({ children, datetimeString }) => {
  const datetime = dayjs.utc(datetimeString).local();

  const theme = useTheme();
  const biggerThanMd = useMediaQuery(theme.breakpoints.up('md'));
  return (
    <List
      component="ul"
      css={css`
        padding: 0;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        & > li {
          width: auto;
        }
      `}
    >
      {children}
      <ListItem
        css={
          biggerThanMd
            ? css`
                margin-left: auto;
              `
            : undefined
        }
      >
        <ListItemText
          primary={datetime.format(TIME_FORMAT)}
          secondary={datetime.format(DATE_FORMAT)}
        />
      </ListItem>
    </List>
  );
};
