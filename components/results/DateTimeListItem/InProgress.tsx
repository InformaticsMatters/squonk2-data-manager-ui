import { useRef } from "react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../../constants/datetimes";
import { useElapsedTime } from "../../../hooks/useTimeElapsed";
import { ResponsiveListItem } from "./ResponsiveListItem";
import { durationText } from "./utils";

dayjs.extend(utc);

export interface InProgressProps {
  startTimestamp: string;
  showDuration: boolean;
}

export const InProgress = ({ startTimestamp, showDuration }: InProgressProps) => {
  const start = dayjs.utc(startTimestamp).local();

  const mountTime = useRef(new Date());

  const duration = (+mountTime.current - +start + useElapsedTime({}) * 1000) / 1000;

  const primaryText = `${start.format(DATE_FORMAT)} ${start.format(TIME_FORMAT)} `;
  const secondaryText = durationText(duration);

  return (
    <ResponsiveListItem
      primary={primaryText}
      secondary={showDuration ? secondaryText : undefined}
    />
  );
};
