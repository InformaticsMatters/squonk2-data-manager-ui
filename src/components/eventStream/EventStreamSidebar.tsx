import { Activity } from "react";

import { Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAtom } from "jotai";

import { eventStreamSidebarOpenAtom } from "../../state/eventStream";
import { EventList } from "./EventList";
import { EventStreamToggle } from "./EventStreamToggle";
import { WebSocketStatusIndicator } from "./WebSocketStatusIndicator";

export const WIDE_DESKTOP_SIDEBAR_WIDTH = 320;

/**
 * Responsive sidebar that shows the live event stream.
 * On desktop, renders as a persistent drawer; on smaller screens the user menu shows events instead.
 */
export const EventStreamSidebar = () => {
  const [open, setOpen] = useAtom(eventStreamSidebarOpenAtom);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const drawerWidth = isDesktop ? WIDE_DESKTOP_SIDEBAR_WIDTH : undefined;

  const handleClose = () => setOpen(false);

  if (!isDesktop) {
    return null;
  }

  return (
    <Activity mode={open ? "visible" : "hidden"}>
      <Paper
        sx={{
          borderRadius: 0,
          width: drawerWidth ?? "min(420px, 100vw)",
          pt: 1.5,
          pb: 2,
          px: 2,
          zIndex: (theme) => theme.zIndex.appBar - 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          height: "100vh",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ flex: 1, fontWeight: 600 }} variant="h6">
            Event Stream
          </Typography>
          <WebSocketStatusIndicator />
          <IconButton aria-label="Close event stream" edge="end" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <EventStreamToggle />
        </Box>
        <Divider />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <EventList />
        </Box>
      </Paper>
    </Activity>
  );
};
