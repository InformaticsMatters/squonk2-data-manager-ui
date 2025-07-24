import { FiberManualRecord } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import { useAtom } from "jotai";

import { getWebSocketStatusFlags, webSocketStatusAtom } from "../../state/eventStream";

const STATUS_CONFIG = {
  connected: {
    color: "success.main",
    text: "Connected",
    tooltip: "Event stream is connected and receiving messages",
  },
  connecting: {
    color: "warning.main",
    text: "Connecting...",
    tooltip: "Connecting to event stream...",
  },
  reconnecting: {
    color: "warning.main",
    text: "Reconnecting...",
    tooltip: "Reconnecting to event stream...",
  },
  disconnected: {
    color: "error.main",
    text: "Disconnected",
    tooltip: "Event stream is disconnected",
  },
} as const;

/**
 * WebSocket connection status indicator
 */
export const WebSocketStatusIndicator = () => {
  const [readyState] = useAtom(webSocketStatusAtom);
  const status = getWebSocketStatusFlags(readyState);

  const getStatusKey = () => {
    if (status.isConnected) {
      return "connected";
    }
    if (status.isConnecting) {
      return "connecting";
    }
    if (status.isReconnecting) {
      return "reconnecting";
    }
    return "disconnected";
  };

  const statusKey = getStatusKey();
  const config = STATUS_CONFIG[statusKey];

  return (
    <Tooltip arrow title={config.tooltip}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          height: "fit-content",
          minHeight: "40px", // Match switch height
          justifyContent: "center",
        }}
      >
        <FiberManualRecord
          sx={{
            fontSize: 10,
            color: config.color,
            animation:
              status.isConnecting || status.isReconnecting
                ? "pulse 1.5s ease-in-out infinite"
                : "none",
            "@keyframes pulse": {
              "0%": { opacity: 1 },
              "50%": { opacity: 0.5 },
              "100%": { opacity: 1 },
            },
          }}
        />
        <Typography
          color="text.secondary"
          sx={{ fontSize: "0.75rem", lineHeight: 1.2, whiteSpace: "nowrap" }}
          variant="caption"
        >
          {config.text}
        </Typography>
      </Box>
    </Tooltip>
  );
};
