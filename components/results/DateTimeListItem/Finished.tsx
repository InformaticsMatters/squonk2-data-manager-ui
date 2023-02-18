import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../../constants/datetimes";
import { ResponsiveListItem } from "./ResponsiveListItem";
import { durationText } from "./utils";

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
  const secondaryText = durationText(duration);

  return (
    <ResponsiveListItem
      primary={primaryText}
      secondary={showDuration ? secondaryText : undefined}
    />
  );
};
