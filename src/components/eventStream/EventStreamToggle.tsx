/**
 * EventStreamToggle renders a switch to enable or disable the event stream (alpha feature).
 */

import { useEffect, useState } from "react";

import { FormControlLabel, Switch } from "@mui/material";
import { useAtom } from "jotai";

import { eventStreamEnabledAtom } from "../../state/eventStream";
import { useIsEventStreamInstalled } from "./useIsEventStreamInstalled";

const EventStreamToggleInner = () => {
  const isEventStreamInstalled = useIsEventStreamInstalled();

  const [eventStreamEnabled, setEventStreamEnabled] = useAtom(eventStreamEnabledAtom);
  return (
    <FormControlLabel
      control={
        <Switch
          checked={eventStreamEnabled}
          color="primary"
          disabled={!isEventStreamInstalled}
          onChange={(_, checked) => setEventStreamEnabled(checked)}
        />
      }
      label={`Event stream ${isEventStreamInstalled ? "(alpha)" : "(not available)"}`}
      sx={{
        margin: 0,
        alignItems: "center",
        "& .MuiFormControlLabel-label": { fontSize: "0.875rem", lineHeight: 1.2 },
      }}
    />
  );
};

export const EventStreamToggle = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return (
      <FormControlLabel
        control={<Switch disabled checked={false} color="primary" />}
        label="Event stream (not available)"
        sx={{
          margin: 0,
          alignItems: "center",
          "& .MuiFormControlLabel-label": { fontSize: "0.875rem", lineHeight: 1.2 },
        }}
      />
    );
  }

  return <EventStreamToggleInner />;
};
