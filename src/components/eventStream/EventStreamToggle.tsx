/**
 * EventStreamToggle renders a switch to enable or disable the event stream (alpha feature).
 */

import { FormControlLabel, Switch } from "@mui/material";
import { useAtom } from "jotai";

import { eventStreamEnabledAtom } from "../../state/eventStream";
import { useIsEventStreamInstalled } from "./useIsEventStreamInstalled";

export const EventStreamToggle = () => {
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
