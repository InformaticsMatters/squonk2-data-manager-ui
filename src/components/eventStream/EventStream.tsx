import { useCallback, useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import { useCreateEventStream, useGetEventStream } from "@/api/account-server/event-stream";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAtom, useAtomValue } from "jotai";
import { useSnackbar } from "notistack";

import { useASAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { getMessageFromEvent } from "../../protobuf/protobuf";
import {
  eventStreamEnabledAtom,
  eventStreamSidebarOpenAtom,
  useEventStream,
  webSocketStatusAtom,
} from "../../state/eventStream";
import { useUnreadEventCount } from "../../state/notifications";
import { EventMessage } from "../eventMessages/EventMessage";
import { describeCloseCode, eventStreamCloseMessage } from "./closeReasons";
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

  const description = describeCloseCode(event.code);
  if (description) {
    console.log(`[EventStream] ${description}`);
  } else {
    console.log(`[EventStream] Unknown close code: ${event.code}`);
  }
};

/**
 * Logs WebSocket error event details. An error is always followed by a close, and the close is
 * what carries the code saying why, so this is where an error is recorded and nowhere else: the
 * caller is told once, about the close, rather than twice about the same dropped connection.
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
  // The address of a stream this component has just created, held only until the read below reports
  // the same stream for itself.
  const [createdLocation, setCreatedLocation] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const isSidebarOpen = useAtomValue(eventStreamSidebarOpenAtom);
  const { incrementCount } = useUnreadEventCount();
  const asRole = useASAuthorizationStatus();
  const { addEvent, isEventNewerThanSession, initializeSession } = useEventStream();

  const { data, error: streamError } = useGetEventStream({
    query: { select: (data) => data.location, enabled: !!asRole && isEventStreamInstalled },
  });

  const { mutate: createEventStream } = useCreateEventStream({
    mutation: {
      onSuccess: (eventStreamResponse) => setCreatedLocation(eventStreamResponse.location),
    },
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
        const isDocked = isSidebarOpen;

        if (!isDocked) {
          enqueueSnackbar(<EventMessage message={message} />, {
            variant: "default",
            anchorOrigin: { horizontal: "right", vertical: "bottom" },
            autoHideDuration: 10_000,
          });
        }
        incrementCount();
      }
    },
    [enqueueSnackbar, incrementCount, addEvent, isEventNewerThanSession, isSidebarOpen],
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

      enqueueSnackbar(eventStreamCloseMessage(event), {
        variant: event.wasClean ? "info" : "warning",
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
      });
    },
    [enqueueSnackbar],
  );

  const handleWebSocketError = useCallback((error: Event) => {
    logWebSocketError(error);
  }, []);

  // Where the stream is: what the read reports, or — until it reports one — what creating a stream
  // here just answered with.
  const location = (asRole ? data : undefined) ?? createdLocation;

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
