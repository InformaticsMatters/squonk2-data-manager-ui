import { FormControlLabel, Switch } from "@mui/material";

import { useEventDebugMode } from "../../state/eventDebugMode";

export const EventDebugSwitch = () => {
  const [debug, setDebug] = useEventDebugMode();
  return (
    <FormControlLabel
      control={<Switch checked={debug} onChange={(_event, checked) => setDebug(checked)} />}
      label="Event debug"
      labelPlacement="start"
    />
  );
};
