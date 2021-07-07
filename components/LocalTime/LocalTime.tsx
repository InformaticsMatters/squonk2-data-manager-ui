import React, { FC, HTMLProps } from 'react';

import { toLocalTimeString } from './utils';

interface BaseLocalTimeProps extends HTMLProps<HTMLSpanElement> {
  utcTimestamp: string;
}

interface FormatLocalTime extends BaseLocalTimeProps {
  format?: string;
  showDate?: never;
  showTime?: never;
}

interface DateTimeLocalTime extends BaseLocalTimeProps {
  format?: never;
  showDate: boolean;
  showTime: boolean;
}

/**
 * Component using dayjs to display a utc timestamp in local time
 * There are two options:
 * 1. Pass a custom format string (dayjs)
 * 2. Choose either date (DD/MM/YY) or time (HH:mm:ss) or both (DD/MM/YY HH:mm:ss) and a time stamp will be given
 *
 * All other props are passed to the root span element
 */
export const LocalTime: FC<FormatLocalTime | DateTimeLocalTime> = ({
  utcTimestamp,
  format,
  showDate = true,
  showTime = true,
  ...spanProps
}) => {
  const localTimestamp = toLocalTimeString(utcTimestamp, showDate, showTime, format);

  return <span {...spanProps}>{localTimestamp}</span>;
};
