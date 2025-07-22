import { Box, Divider, Typography } from "@mui/material";

import { EventList } from "./EventList";
import { EventStreamToggle } from "./EventStreamToggle";

/**
 * Main event stream interface in the user menu popover
 */
export const EventStreamMessages = () => (
  <Box sx={{ minWidth: 300 }}>
    <Typography sx={{ mb: 1 }} variant="h6">
      Event Stream
    </Typography>

    <EventStreamToggle />

    <Divider sx={{ my: 2 }} />

    <EventList />
  </Box>
);
