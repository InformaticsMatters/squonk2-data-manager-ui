import { useCallback, useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import {
  useCreateEventStream,
  useGetEventStream,
} from "@squonk/account-server-client/event-stream";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAtom } from "jotai";
import { useSnackbar } from "notistack";

import { useASAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { getMessageFromEvent } from "../../protobuf/protobuf";
import {
  eventStreamEnabledAtom,
  useEventStream,
  webSocketStatusAtom,
} from "../../state/eventStream";
import { useUnreadEventCount } from "../../state/notifications";
import { EventMessage } from "../eventMessages/EventMessage";
import { useIsEventStreamInstalled } from "./useIsEventStreamInstalled";

dayjs.extend(utc);

const WebSocketCloseCode = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_PAYLOAD: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  CLIENT_TERMINATED: 1010,
  SERVER_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE_FAIL: 1015,
  POLICY_UNAUTHORIZED: 4401,
  POLICY_FORBIDDEN: 4403,
} as const;

type WebSocketCloseCodeValue = (typeof WebSocketCloseCode)[keyof typeof WebSocketCloseCode];

const closeCodeDescriptions: Record<WebSocketCloseCodeValue, string> = {
  [WebSocketCloseCode.NORMAL]: "Normal closure - connection completed successfully",
  [WebSocketCloseCode.GOING_AWAY]: "Going away - server is shutting down or client navigating away",
  [WebSocketCloseCode.PROTOCOL_ERROR]: "Protocol error - invalid data received",
  [WebSocketCloseCode.UNSUPPORTED_DATA]: "Unsupported data - received data type not supported",
  [WebSocketCloseCode.NO_STATUS]: "No status received - no close code provided",
  [WebSocketCloseCode.ABNORMAL]: "Abnormal closure - connection lost without close frame",
  [WebSocketCloseCode.INVALID_PAYLOAD]: "Invalid frame payload data - received inconsistent data",
  [WebSocketCloseCode.POLICY_VIOLATION]: "Policy violation - message violates server policy",
  [WebSocketCloseCode.MESSAGE_TOO_BIG]: "Message too big - message exceeds size limit",
  [WebSocketCloseCode.CLIENT_TERMINATED]: "Client error - client terminated connection",
  [WebSocketCloseCode.SERVER_ERROR]: "Server error - server encountered error",
  [WebSocketCloseCode.SERVICE_RESTART]: "Service restart - server restarting",
  [WebSocketCloseCode.TRY_AGAIN_LATER]: "Try again later - temporary server condition",
  [WebSocketCloseCode.BAD_GATEWAY]: "Bad gateway - invalid response from upstream",
  [WebSocketCloseCode.TLS_HANDSHAKE_FAIL]: "TLS handshake - TLS handshake failed",
  [WebSocketCloseCode.POLICY_UNAUTHORIZED]: "Policy violation - unauthorized",
  [WebSocketCloseCode.POLICY_FORBIDDEN]: "Policy violation - forbidden",
};

/**
 * Logs WebSocket connection open event
 */
const logWebSocketOpen = () => {
  console.log("[EventStream] WebSocket connection opened successfully");
};

/**
 * Logs detailed WebSocket close event information
 */
const logWebSocketClose = (event: CloseEvent) => {
  const closeInfo = {
    code: event.code,
    reason: event.reason || "No reason provided",
    wasClean: event.wasClean,
    timestamp: new Date().toISOString(),
  };

  console.log("[EventStream] WebSocket connection closed:", closeInfo);

  const description = closeCodeDescriptions[event.code as WebSocketCloseCodeValue];
  if (description) {
    console.log(`[EventStream] ${description}`);
  } else {
    console.log(`[EventStream] Unknown close code: ${event.code}`);
  }
};

/**
 * Logs WebSocket error event details
 */
const logWebSocketError = (error: Event) => {
  console.error("[EventStream] WebSocket connection error:", error);
  console.error("[EventStream] Error details:", {
    type: error.type,
    target: error.target,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Builds WebSocket URL
 */
const buildWebSocketUrl = (location: string): string => {
  const url = new URL(location);
  url.protocol = "wss:";

  // Add ordinal parameter to get all historical messages
  url.searchParams.set("stream_from_ordinal", "1");

  return url.toString();
};

/**
 * Manages WebSocket connection for event stream and displays toast notifications
 */
export const EventStream = () => {
  const isEventStreamInstalled = useIsEventStreamInstalled();
  const [location, setLocation] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { incrementCount } = useUnreadEventCount();
  const asRole = useASAuthorizationStatus();
  const { addEvent, isEventNewerThanSession, initializeSession } = useEventStream();

  const { data, error: streamError } = useGetEventStream({
    query: { select: (data) => data.location, enabled: !!asRole && isEventStreamInstalled },
  });

  const { mutate: createEventStream } = useCreateEventStream({
    mutation: { onSuccess: (eventStreamResponse) => setLocation(eventStreamResponse.location) },
  });

  const [eventStreamEnabled] = useAtom(eventStreamEnabledAtom);
  const [, setWebSocketStatus] = useAtom(webSocketStatusAtom);

  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      const message = getMessageFromEvent(JSON.parse(event.data));

      if (
        message &&
        addEvent(message) && // Only show toast for events newer than session start
        isEventNewerThanSession(message)
      ) {
        enqueueSnackbar(<EventMessage message={message} />, {
          variant: "default",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
          autoHideDuration: 10_000,
        });
        incrementCount();
      }
    },
    [enqueueSnackbar, incrementCount, addEvent, isEventNewerThanSession],
  );

  const handleWebSocketOpen = useCallback(() => {
    logWebSocketOpen();
    enqueueSnackbar("Connected to event stream", {
      variant: "success",
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
    });
  }, [enqueueSnackbar]);

  const handleWebSocketClose = useCallback(
    (event: CloseEvent) => {
      logWebSocketClose(event);

      const message = event.wasClean
        ? "Disconnected from event stream"
        : "Event stream disconnected unexpectedly. Attempting to reconnect...";

      enqueueSnackbar(message, {
        variant: event.wasClean ? "info" : "warning",
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
      });
    },
    [enqueueSnackbar],
  );

  const handleWebSocketError = useCallback(
    (error: Event) => {
      logWebSocketError(error);

      enqueueSnackbar("Event stream connection error. Reconnection attempts may follow.", {
        variant: "error",
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
      });
    },
    [enqueueSnackbar],
  );

  // Build WebSocket URL
  const wsUrl = eventStreamEnabled && asRole && location ? buildWebSocketUrl(location) : null;

  const { readyState } = useWebSocket(wsUrl, {
    onOpen: handleWebSocketOpen,
    onClose: handleWebSocketClose,
    onError: handleWebSocketError,
    onMessage: handleWebSocketMessage,
    retryOnError: true,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  // Expose connection status for status indicator
  useEffect(() => {
    setWebSocketStatus(readyState);
  }, [readyState, setWebSocketStatus]);

  useEffect(() => {
    if (asRole && data) {
      setLocation(data);
    }
  }, [asRole, data]);

  useEffect(() => {
    if (asRole && streamError?.response?.status === 404) {
      createEventStream({ data: { format: "JSON_STRING" } });
    }
  }, [asRole, streamError, createEventStream]);

  // Initialize session on client side only
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return null;
};
