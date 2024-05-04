import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT } from "../../constants/datetimes";

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
  // This gives users the most time from creating the unit to the first bill.
  // Billing day must be between 1 and 28.
  // We pick the previous day "yesterday" or the 28 whichever is smaller.
  // If today is the first day of the month then `today - 1` is zero which is invalid so we loop
  // back to the 28th
  return Math.min(28, today - 1 || 28);
};

export const getBillingPeriods = (billingDay: number, created: string) => {
  const createdDay = dayjs.utc(created);

  const firstBillingDay = createdDay.set("date", billingDay);

  let date = firstBillingDay;
  const dates: Dayjs[] = [];
  while (date.valueOf() < dayjs().valueOf()) {
    dates.push(date);
    date = date.add(1, "month");
  }

  return dates.map((d, index) => [
    index - dates.length + 1,
    d.local().format(DATE_FORMAT),
    d.local().add(1, "month").format(DATE_FORMAT),
  ]);
};
