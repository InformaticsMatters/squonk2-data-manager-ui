import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

import {
  useCreateEventStream,
  useGetEventStream,
} from "@squonk/account-server-client/event-stream";

import { useSnackbar } from "notistack";

import { getMessageFromEvent, protoBlobToText } from "../protobuf/protobuf";
import { EventMessage } from "./eventMessages/EventMessage";

// Helper function to get readable state name
const getConnectionStatus = (readyState: ReadyState) => {
  const stateMap: Record<ReadyState, string> = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  };
  return stateMap[readyState];
};

export const EventStream = () => {
  const [location, setLocation] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const { data, error: streamError } = useGetEventStream({
    query: { select: (data) => data.location },
  });

  useEffect(() => {
    data && setLocation(data);
  }, [data]);

  const { mutate: createEventStream } = useCreateEventStream({
    mutation: {
      onSuccess: (eventStreamResponse) => {
        setLocation(eventStreamResponse.location);
      },
    },
  });

  useEffect(() => {
    if (streamError?.response?.status === 404) {
      console.log("EventStream: No active stream found, creating one...");
      createEventStream({ data: { format: "JSON_STRING" } });
    }
  }, [streamError, createEventStream]);

  const handleWebSocketOpen = useCallback(() => {
    enqueueSnackbar("Connected to event stream", {
      variant: "success",
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
    });
  }, [enqueueSnackbar]);

  const handleWebSocketClose = useCallback(
    (event: CloseEvent) => {
      if (event.wasClean) {
        enqueueSnackbar("Disconnected from event stream", {
          variant: "info",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
        });
      } else {
        console.warn(
          "EventStream: WebSocket closed unexpectedly. Reconnection attempts are handled by react-use-websocket.",
        );
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

  const { readyState } = useWebSocket(location, {
    onOpen: handleWebSocketOpen,
    onClose: handleWebSocketClose,
    onError: handleWebSocketError,
    onMessage: handleWebSocketMessage,
    shouldReconnect: () => true,
    retryOnError: true,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    console.log(`WebSocket Status: ${getConnectionStatus(readyState)}`);
  }, [readyState]);

  return null;
};
