import { type UserActivityDetail } from "@squonk/data-manager-client";

import { type Column, type ColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../constants/datetimes";

dayjs.extend(utc);

export interface UserActivity {
  activity: UserActivityDetail;
  first_seen: string;
  last_seen_date: string;
}

export const getSharedColumns = <T extends UserActivity>(columnHelper: ColumnHelper<T>) => {
  // This is a workaround to allow the columnHelper to be used as a ColumnHelper<InventoryUserDetail>
  // @tanstack/react-table doesn't work well with this generic function
  const columnHelperFixed = columnHelper as unknown as ColumnHelper<UserActivity>;
  const columns = [
    columnHelperFixed.group({
      header: "Activity",
      columns: [
        columnHelperFixed.accessor("first_seen", {
          header: "First Seen",
          cell: ({ getValue, row }) =>
            `${dayjs.utc(getValue()).format(`${DATE_FORMAT} ${TIME_FORMAT}`)} (${
              row.original.activity.total_days_since_first_seen
            } days ago)`,
          sortingFn: (a, b) =>
            dayjs.utc(a.original.first_seen).diff(dayjs.utc(b.original.first_seen)),
        }),
      ],
    }),
    columnHelperFixed.accessor("activity.total_days_active", {
      header: "Total",
      cell: ({ getValue }) => `${getValue()} days`,
    }),
    columnHelperFixed.accessor((user) => user.activity.period_b?.active_days, {
      id: "activity_b",
      header: "API Used",
      cell: ({
        row: {
          original: { activity },
        },
      }) => `${activity.period_b?.active_days} of last ${activity.period_b?.monitoring_period}`,
    }),
    columnHelperFixed.accessor((user) => user.activity.period_a.active_days, {
      id: "activity_a",
      header: "",
      cell: ({
        row: {
          original: { activity },
        },
      }) => `${activity.period_a.active_days} of last ${activity.period_a.monitoring_period}`,
    }),
    columnHelperFixed.accessor("last_seen_date", {
      header: "Last Seen",
      cell: ({ getValue }) => dayjs.utc(getValue()).format(DATE_FORMAT),
      sortingFn: (a, b) =>
        dayjs.utc(a.original.last_seen_date).diff(dayjs.utc(b.original.last_seen_date)),
    }),
  ];

  return columns as Column<T, T[keyof T]>[];
};
