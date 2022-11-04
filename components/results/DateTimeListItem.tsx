import { ListItem, ListItemText, useMediaQuery, useTheme } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../constants/datetimes";

dayjs.extend(utc);

export interface DateTimeListItemProps {
  /**
   * UTC date time to display in the last list item. Time is displayed in the user's local time.
   */
  datetimeString?: string;
}

export const DateTimeListItem = ({ datetimeString }: DateTimeListItemProps) => {
  const datetime = dayjs.utc(datetimeString).local();

  const theme = useTheme();
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <ListItem sx={{ ml: biggerThanMd ? "auto" : undefined }}>
      <ListItemText
        primary={datetime.format(TIME_FORMAT)}
        secondary={datetime.format(DATE_FORMAT)}
      />
    </ListItem>
  );
};
