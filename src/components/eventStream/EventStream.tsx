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
    enqueueSnackbar("Connected to event stream", {
      variant: "success",
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
    });
  }, [enqueueSnackbar]);

  const handleWebSocketClose = useCallback(
    (event: CloseEvent) => {
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

  const handleWebSocketError = useCallback(() => {
    enqueueSnackbar("Event stream connection error. Reconnection attempts may follow.", {
      variant: "error",
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
    });
  }, [enqueueSnackbar]);

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
