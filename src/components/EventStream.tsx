import { useEffect, useState } from "react";

import {
  useCreateEventStream,
  useGetEventStream,
} from "@squonk/account-server-client/event-stream";

import { useSnackbar } from "notistack";

import { getMessageFromEvent, protoBlobToText } from "../protobuf/protobuf";
import { EventMessage } from "./eventMessages/EventMessage";

export const EventStream = () => {
  const [location, setLocation] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const { data, error } = useGetEventStream();

  useEffect(() => {
    if (data) {
      setLocation(data.location);
    }
  }, [data]);
  const { mutate: createEventStream } = useCreateEventStream({
    mutation: {
      onSuccess: (data) => {
        setLocation(data.location);
      },
    },
  });

  useEffect(() => {
    if (error?.response?.status === 404) {
      createEventStream({ data: { format: "JSON_STRING" } });
    }
  }, [error, createEventStream]);

  useEffect(() => {
    if (location) {
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
        void protoBlobToText(event.data).then((data) => {
          const message = getMessageFromEvent(data);
          message &&
            enqueueSnackbar(<EventMessage message={message} />, {
              variant: "default",
              anchorOrigin: { horizontal: "right", vertical: "bottom" },
              autoHideDuration: 100_000,
            });
        });
      });

      return () => {
        ws.close();
      };
    }
  }, [location, enqueueSnackbar]);

  return null;
};
