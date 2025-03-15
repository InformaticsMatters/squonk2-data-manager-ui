import { useEffect, useState } from "react";

import {
  useCreateEventStream,
  useGetEventStream,
} from "@squonk/account-server-client/event-stream";

import { useSnackbar } from "notistack";
import * as protobuf from "protobufjs";

export const EventStream = () => {
  const [eventStreamId, setEventStreamId] = useState<number | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [protoRoot, setProtoRoot] = useState<protobuf.Root | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { data, error } = useGetEventStream();

  useEffect(() => {
    // Initialize protobuf root
    const root = new protobuf.Root();
    // You would typically load your proto definitions here
    // For example: root.load("path/to/proto/file.proto", { keepCase: true })
    setProtoRoot(root);
  }, []);

  useEffect(() => {
    if (data) {
      setEventStreamId(data.id);
      setLocation(data.location);
    }
  }, [data]);

  const { mutate: createEventStream } = useCreateEventStream({
    mutation: {
      onSuccess: (data) => {
        setEventStreamId(data.id);
        setLocation(data.location);
      },
    },
  });

  useEffect(() => {
    if (error?.response?.status === 404) {
      createEventStream();
    }
  }, [error, createEventStream]);

  useEffect(() => {
    if (location && protoRoot) {
      // Create WebSocket connection
      const ws = new WebSocket(location);

      ws.addEventListener("open", () => {
        enqueueSnackbar("Connected to event stream", {
          variant: "success",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
        });
      });

      ws.addEventListener("error", () => {
        enqueueSnackbar("Failed to connect to event stream", {
          variant: "error",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
        });
      });

      ws.addEventListener("close", () => {
        enqueueSnackbar("Disconnected from event stream", {
          variant: "warning",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
        });
      });

      ws.addEventListener("message", (event) => {
        enqueueSnackbar(`Received event: ${event.data}`, {
          variant: "info",
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
        });
      });

      setWebsocket(ws);

      return () => {
        ws.close();
      };
    }
  }, [location, protoRoot, enqueueSnackbar]);

  console.log(eventStreamId);
  console.log(websocket);

  return null;
};
