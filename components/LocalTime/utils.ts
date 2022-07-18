import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const DATE_FORMAT = "DD/MM/YY";
export const TIME_FORMAT = "HH:mm:ss";

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
