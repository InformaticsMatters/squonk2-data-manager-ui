import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../../constants/datetimes";
import { formatRelativeTime } from "../../../utils/app/datetime";
import { ResponsiveListItem } from "./ResponsiveListItem";

dayjs.extend(utc);

export interface FinishedProps {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  showDuration: boolean;
}

export const Finished = ({ start, end, showDuration }: FinishedProps) => {
  const primaryText = `${start.format(DATE_FORMAT)} ${start.format(TIME_FORMAT)} `;
  const difference = +end - +start;
  const secondaryText = `(Duration: ${formatRelativeTime(difference)})`;

  return (
    <ResponsiveListItem
      primary={primaryText}
      secondary={showDuration ? secondaryText : undefined}
    />
  );
};
