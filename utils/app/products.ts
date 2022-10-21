import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Formats the tier string, e.g. GOLD -> Gold.
 */
export const formatTierString = (original: string) => {
  return original.charAt(0).toUpperCase() + original.slice(1).toLowerCase();
};

/**
 * Gets the billing day for a product in the range of 1-28
 */
export const getBillingDay = () => {
  const today = new Date().getDate();
  return Math.min(28, today - 1);
};

export const getBillingPeriods = (billingDay: number, created: string) => {
  const createdDay = dayjs.utc(created);

  let firstBillingDay: Dayjs;
  if (billingDay > createdDay.day()) {
    // Current moths billing day hasn't happened yet
    firstBillingDay = createdDay.set("day", billingDay);
  } else {
    // Current months billing day has already passed
    firstBillingDay = createdDay.set("day", billingDay).add(1, "month");
  }

  let date = firstBillingDay;
  const dates: Dayjs[] = [];
  while (date.valueOf() < dayjs().valueOf()) {
    dates.push(date);
    date = date.add(1, "month");
  }

  return dates.map((d, index) => [
    index - dates.length + 1,
    d.local().format("YYYY-MM-DD"),
    d.local().add(1, "month").subtract(1, "day").format("YYYY-MM-DD"),
  ]);
};
