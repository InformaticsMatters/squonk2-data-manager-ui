import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

import { Finished } from "./Finished";
import { InProgress } from "./InProgress";
dayjs.extend(utc);
dayjs.extend(relativeTime);

export interface DateTimeListItemProps {
  /**
   * String timestamp that can be parsed by `dayjs.utc`. Controls the start time displayed.
   */
  startTimestamp: string;
  /**
   * String timestamp that can be parsed by `dayjs.utc`. Controls the duration that's displayed.
   * If this is provided, a fixed duration of the formatted time difference is displayed.
   * If left undefined, the time to right now is displayed.
   */
  endTimestamp?: string;
  /**
   * Whether to display the duration
   */
  showDuration: boolean;
}

export const DateTimeListItem = ({
  startTimestamp,
  endTimestamp,
  showDuration,
}: DateTimeListItemProps) => {
  const start = dayjs.utc(startTimestamp).local();
  const end = dayjs.utc(endTimestamp).local();

  if (endTimestamp === undefined) {
    return <InProgress showDuration={showDuration} start={start} />;
  }

  return <Finished end={end} showDuration={showDuration} start={start} />;
};
