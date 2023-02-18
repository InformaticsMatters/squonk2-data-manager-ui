import { useRef } from "react";

import type dayjs from "dayjs";

import { DATE_FORMAT, TIME_FORMAT } from "../../../constants/datetimes";
import { useElapsedTime } from "../../../hooks/useTimeElapsed";
import { formatRelativeTime } from "../../../utils/app/datetime";
import { ResponsiveListItem } from "./ResponsiveListItem";

export interface InProgressProps {
  start: dayjs.Dayjs;
  showDuration: boolean;
}

export const InProgress = ({ start, showDuration }: InProgressProps) => {
  const mountTime = useRef(new Date());

  const time = (+mountTime.current - +start + useElapsedTime({}) * 1000) / 1000;

  const primaryText = `${start.format(DATE_FORMAT)} ${start.format(TIME_FORMAT)} `;
  const secondaryText = `(Duration: ${formatRelativeTime(time)})`;

  return (
    <ResponsiveListItem
      primary={primaryText}
      secondary={showDuration ? secondaryText : undefined}
    />
  );
};
