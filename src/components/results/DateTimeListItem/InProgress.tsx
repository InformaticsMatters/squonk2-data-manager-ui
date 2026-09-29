import { useMemo } from "react";

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

  // Latched at mount so the ticking elapsed time is measured from a fixed origin rather than from
  // a clock read that moves under it every render.
  const mountTime = useMemo(() => new Date(), []);

  const duration = (+mountTime - +start + useElapsedTime({}) * 1000) / 1000;

  const primaryText = `${start.format(DATE_FORMAT)} ${start.format(TIME_FORMAT)} `;
  const secondaryText = durationText(duration);

  return (
    <ResponsiveListItem
      primary={primaryText}
      secondary={showDuration ? secondaryText : undefined}
    />
  );
};
