import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { Finished } from "./Finished";
import { InProgress } from "./InProgress";

dayjs.extend(utc);

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
  if (endTimestamp === undefined) {
    return <InProgress showDuration={showDuration} startTimestamp={startTimestamp} />;
  }

  return (
    <Finished
      endTimestamp={endTimestamp}
      showDuration={showDuration}
      startTimestamp={startTimestamp}
    />
  );
};
