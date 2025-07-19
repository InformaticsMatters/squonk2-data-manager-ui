import { useCallback, useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import {
  useCreateEventStream,
  useGetEventStream,
} from "@squonk/account-server-client/event-stream";

import { useAtom } from "jotai";
import { useSnackbar } from "notistack";

import { useASAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { getMessageFromEvent, protoBlobToText } from "../../protobuf/protobuf";
import { eventStreamEnabledAtom } from "../../state/eventStream";
import { EventMessage } from "../eventMessages/EventMessage";
import { useIsEventStreamInstalled } from "./useIsEventStreamInstalled";

export const EventStream = () => {
  const isEventStreamInstalled = useIsEventStreamInstalled();
  const [location, setLocation] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const asRole = useASAuthorizationStatus();

  const { data, error: streamError } = useGetEventStream({
    query: { select: (data) => data.location, enabled: !!asRole && isEventStreamInstalled },
  });
  const { mutate: createEventStream } = useCreateEventStream({
    mutation: {
      onSuccess: (eventStreamResponse) => {
        setLocation(eventStreamResponse.location);
      },
    },
  });
  const [eventStreamEnabled] = useAtom(eventStreamEnabledAtom);

  // Define callbacks *before* useWebSocket hook
  const handleWebSocketOpen = useCallback(() => {
    enqueueSnackbar("Connected to event stream", {
      variant: "success",
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
    });
  }, [enqueueSnackbar]);

  const handleWebSocketClose = useCallback(
    (event: CloseEvent) => {
      console.log(event);
      if (event.wasClean) {
        enqueueSnackbar("Disconnected from event stream", {
          variant: "info",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
        });
      } else {
        console.warn("EventStream: WebSocket closed unexpectedly.");
        enqueueSnackbar("Event stream disconnected unexpectedly. Attempting to reconnect...", {
          variant: "warning",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
        });
      }
    },
    [enqueueSnackbar],
  );

  const handleWebSocketError = useCallback(() => {
    enqueueSnackbar("Event stream connection error. Reconnection attempts may follow.", {
      variant: "error",
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
    });
  }, [enqueueSnackbar]);

  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data instanceof Blob) {
        protoBlobToText(event.data)
          .then((textData) => {
            const message = getMessageFromEvent(textData);
            if (message) {
              enqueueSnackbar(<EventMessage message={message} />, {
                variant: "default",
                anchorOrigin: { horizontal: "right", vertical: "bottom" },
                autoHideDuration: 10_000,
              });
            } else {
              console.warn(
                "Received event data could not be parsed into a known message type:",
                textData,
              );
            }
          })
          .catch((error) => {
            console.error("Error processing protobuf message:", error);
            enqueueSnackbar("Error processing incoming event", {
              variant: "error",
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
            });
          });
      } else {
        console.warn("Received non-Blob WebSocket message:", event.data);
      }
    },
    [enqueueSnackbar],
  );

  const wsUrl = eventStreamEnabled && asRole ? (location?.replace("ws", "wss") ?? null) : null;

  useWebSocket(wsUrl, {
    onOpen: handleWebSocketOpen,
    onClose: handleWebSocketClose,
    onError: handleWebSocketError,
    onMessage: handleWebSocketMessage,
    shouldReconnect: () => true,
    retryOnError: true,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  // Effects can now safely use the hook results or return early based on auth
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

  return null;
};
