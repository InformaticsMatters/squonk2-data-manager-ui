import type { HTMLProps } from "react";

import { toLocalTimeString } from "./utils";

export interface BaseLocalTimeProps extends HTMLProps<HTMLSpanElement> {
  /**
   * UTC timestamp to be parsed
   */
  utcTimestamp: string;
}

export interface FormatLocalTime extends BaseLocalTimeProps {
  /**
   * Custom format code for the output string
   */
  format?: string;
  showDate?: never;
  showTime?: never;
}

export interface DateTimeLocalTime extends BaseLocalTimeProps {
  format?: never;
  /**
   * Whether to show the date in the output
   */
  showDate: boolean;
  /**
   * Whether to show the time in the output
   */
  showTime: boolean;
}

export type LocalTimeProps = FormatLocalTime | DateTimeLocalTime;

/**
 * Component using dayjs to display a utc timestamp in local time
 * There are two options:
 * 1. Pass a custom format string (dayjs)
 * 2. Choose either date (DD/MM/YY) or time (HH:mm:ss) or both (DD/MM/YY HH:mm:ss) and a time stamp will be given
 *
 * All other props are passed to the root span element
 */
export const LocalTime = ({
  utcTimestamp,
  format,
  showDate = true,
  showTime = true,
  ...spanProps
}: LocalTimeProps) => {
  const localTimestamp = toLocalTimeString(utcTimestamp, showDate, showTime, format);

  return <span {...spanProps}>{localTimestamp}</span>;
};
