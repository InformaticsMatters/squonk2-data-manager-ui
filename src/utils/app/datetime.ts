import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../constants/datetimes";

dayjs.extend(utc);

export const toLocalTimeString = (
  utcTimestamp: string,
  showDate: boolean,
  showTime: boolean,
  format?: string,
) => {
  const datetime = dayjs.utc(utcTimestamp).local();

  if (format) {
    return datetime.format(format);
  } else if (showDate && !showTime) {
    return datetime.format(DATE_FORMAT);
  } else if (!showDate && showTime) {
    return datetime.format(TIME_FORMAT);
  }
  return datetime.format(`${DATE_FORMAT} ${TIME_FORMAT}`);
};

const SECONDS_IN_A_DAY = 60 * 60 * 24;
const SECONDS_IN_A_HOUR = 60 * 60;
const SECONDS_IN_A_MINUTE = 60;

export const formatRelativeTime = (time: number): string => {
  let positive = true;
  if (time < 0) {
    positive = false;
    time = -time;
  }

  const days = Math.floor(time / SECONDS_IN_A_DAY);
  const rounded_days_as_seconds = time - days * SECONDS_IN_A_DAY;
  const hours = Math.floor(rounded_days_as_seconds / SECONDS_IN_A_HOUR);
  const rounded_hours_as_seconds = hours * SECONDS_IN_A_HOUR;
  const minutes = Math.floor(
    (rounded_days_as_seconds - rounded_hours_as_seconds) / SECONDS_IN_A_MINUTE,
  );
  const seconds = Math.floor(time % SECONDS_IN_A_MINUTE);

  let elapsedString = "";
  days > 0 && (elapsedString += `${days} d `);
  hours > 0 && (elapsedString += `${hours} hr `);
  minutes > 0 && (elapsedString += `${minutes} min `);
  elapsedString += `${seconds} s `;
  elapsedString = elapsedString.trim();

  if (positive) {
    return elapsedString;
  }

  return `-${elapsedString}`;
};
