import { expect, test } from "@playwright/test";

import { formatRelativeTime } from "../utils/app/datetime";

test.describe("relative date-times can be formatted", () => {
  test("negative times", () => {
    expect(formatRelativeTime(-1)).toEqual("-1 s");
    expect(formatRelativeTime(-0)).toEqual("0 s");
  });

  test("second values", () => {
    expect(formatRelativeTime(0)).toEqual("0 s");
    expect(formatRelativeTime(1)).toEqual("1 s");
    expect(formatRelativeTime(10)).toEqual("10 s");
    expect(formatRelativeTime(59)).toEqual("59 s");
  });

  test("minute values", () => {
    expect(formatRelativeTime(60)).toEqual("1 min 0 s");
    expect(formatRelativeTime(61)).toEqual("1 min 1 s");
    expect(formatRelativeTime(3599)).toEqual("59 min 59 s");
  });

  test("hour values", () => {
    expect(formatRelativeTime(3600)).toEqual("1 hr 0 s");
    expect(formatRelativeTime(3601)).toEqual("1 hr 1 s");
    expect(formatRelativeTime(86399)).toEqual("23 hr 59 min 59 s");
  });

  test("day values", () => {
    expect(formatRelativeTime(86400)).toEqual("1 d 0 s");
    expect(formatRelativeTime(86401)).toEqual("1 d 1 s");
    expect(formatRelativeTime(10000000000000)).toEqual("115740740 d 17 hr 46 min 40 s");
  });
});
