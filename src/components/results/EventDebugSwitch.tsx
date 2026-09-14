import { FormControlLabel, Switch, Typography } from "@mui/material";

import { useEventDebugMode } from "../../state/eventDebugMode";

/**
 * Whether the section shows what it is told about its own events. It is named in words rather than
 * by an icon, because the rail it sits in has the width to say what the control does.
 */
export const EventDebugSwitch = () => {
  const [debug, setDebug] = useEventDebugMode();
  return (
    <FormControlLabel
      control={
        <Switch checked={debug} size="small" onChange={(_event, checked) => setDebug(checked)} />
      }
      label={<Typography variant="body2">Event debug</Typography>}
      sx={{ m: 0 }}
    />
  );
};
