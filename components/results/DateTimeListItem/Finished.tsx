import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../../constants/datetimes";
import { formatRelativeTime } from "../../../utils/app/datetime";
import { ResponsiveListItem } from "./ResponsiveListItem";

dayjs.extend(utc);

export interface FinishedProps {
  startTimestamp: string;
  endTimestamp: string;
  showDuration: boolean;
}

export const Finished = ({ startTimestamp, endTimestamp, showDuration }: FinishedProps) => {
  const start = dayjs.utc(startTimestamp);
  const end = dayjs.utc(endTimestamp);

  const primaryText = `${start.local().format(DATE_FORMAT)} ${start.local().format(TIME_FORMAT)} `;
  const duration = (+end - +start) / 1000;
  const secondaryText = `(Duration: ${formatRelativeTime(duration)})`;

  return (
    <ResponsiveListItem
      primary={primaryText}
      secondary={showDuration ? secondaryText : undefined}
    />
  );
};
