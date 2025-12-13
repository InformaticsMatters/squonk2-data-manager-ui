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
import { getMessageFromEvent, protoBlobToText } from "../../protobuf/protobuf";
import {
  eventStreamEnabledAtom,
  useEventStream,
  webSocketStatusAtom,
} from "../../state/eventStream";
import { useUnreadEventCount } from "../../state/notifications";
import { EventMessage } from "../eventMessages/EventMessage";
import { useIsEventStreamInstalled } from "./useIsEventStreamInstalled";

dayjs.extend(utc);

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

  // Log specific close codes for debugging
  switch (event.code) {
    case 1000:
      console.log("[EventStream] Normal closure - connection completed successfully");
      break;
    case 1001:
      console.log("[EventStream] Going away - server is shutting down or client navigating away");
      break;
    case 1002:
      console.log("[EventStream] Protocol error - invalid data received");
      break;
    case 1003:
      console.log("[EventStream] Unsupported data - received data type not supported");
      break;
    case 1005:
      console.log("[EventStream] No status received - no close code provided");
      break;
    case 1006:
      console.log("[EventStream] Abnormal closure - connection lost without close frame");
      break;
    case 1007:
      console.log("[EventStream] Invalid frame payload data - received inconsistent data");
      break;
    case 1008:
      console.log("[EventStream] Policy violation - message violates server policy");
      break;
    case 1009:
      console.log("[EventStream] Message too big - message exceeds size limit");
      break;
    case 1010:
      console.log("[EventStream] Client error - client terminated connection");
      break;
    case 1011:
      console.log("[EventStream] Server error - server encountered error");
      break;
    case 1012:
      console.log("[EventStream] Service restart - server restarting");
      break;
    case 1013:
      console.log("[EventStream] Try again later - temporary server condition");
      break;
    case 1014:
      console.log("[EventStream] Bad gateway - invalid response from upstream");
      break;
    case 1015:
      console.log("[EventStream] TLS handshake - TLS handshake failed");
      break;
    default:
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
      const processMessage = (payload: any) => {
        const message = getMessageFromEvent(payload);

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
      };

      if (event.data instanceof Blob) {
        protoBlobToText(event.data)
          .then((textData) => processMessage(textData))
          .catch((error) => {
            console.error("Error processing protobuf message:", error);
            enqueueSnackbar("Error processing incoming event", {
              variant: "error",
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
            });
          });
      } else {
        let parsed: unknown = event.data;
        try {
          parsed = JSON.parse(event.data as string);
        } catch {
          // Non-JSON payload; proceed with raw data
        }
        processMessage(parsed);
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
    shouldReconnect: () => true,
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
