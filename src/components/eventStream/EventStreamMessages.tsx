import { Box, Divider, Typography } from "@mui/material";

import { EventList } from "./EventList";
import { EventStreamToggle } from "./EventStreamToggle";
import { WebSocketStatusIndicator } from "./WebSocketStatusIndicator";

/**
 * Main event stream interface in the user menu popover
 */
export const EventStreamMessages = () => (
  <Box sx={{ minWidth: 300 }}>
    <Typography sx={{ mb: 2 }} variant="h6">
      Event Stream
    </Typography>

    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
      <EventStreamToggle />
      <WebSocketStatusIndicator />
    </Box>

    <Divider sx={{ my: 2 }} />

    <EventList />
  </Box>
);
