import { Box, List, ListItem, Typography } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../constants/datetimes";
import { useEventStream } from "../../state/eventStream";
import { EventMessage } from "../eventMessages/EventMessage";

dayjs.extend(utc);

/**
 * Displays a list of events sorted by timestamp (newest first)
 */
export const EventList = () => {
  const { events } = useEventStream();

  if (events.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography color="text.secondary" variant="body2">
          No events to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 400, overflow: "auto" }}>
      <Typography sx={{ p: 1, fontWeight: "bold" }} variant="subtitle2">
        Events ({events.length})
      </Typography>

      <List dense>
        {events.map((event) => {
          const eventTime = dayjs.utc(event.timestamp);

          return (
            <ListItem key={`${event.timestamp}-${event.ordinal}`} sx={{ mb: 1, borderRadius: 1 }}>
              <Box sx={{ width: "100%" }}>
                <Typography
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                  variant="caption"
                >
                  {eventTime.local().format(TIME_FORMAT)} • {eventTime.local().format(DATE_FORMAT)}
                </Typography>
                <EventMessage message={event} />
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};
