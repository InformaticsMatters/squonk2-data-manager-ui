import { Alert, Button, Stack } from "@mui/material";

import { usePersonalUnitCreation } from "./usePersonalUnitCreation";

/**
 * The one control that creates the caller's own personal unit: the request, what it is doing, and
 * what a failure it could not settle by observation says.
 *
 * Both places that offer the unit render this — the onboarding panel, and the creation screen's
 * safety net for a caller who arrived by URL — so the action, its pending label and its failure are
 * written once rather than drifting apart between two surfaces offering the same thing.
 */
export const PersonalUnitCreation = () => {
  const { createPersonalUnit, state } = usePersonalUnitCreation();
  const creating = state.kind === "creating";

  return (
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <Button disabled={creating} variant="contained" onClick={() => void createPersonalUnit()}>
        {creating ? "Creating..." : "Create personal unit"}
      </Button>
      {state.kind === "failed" ? (
        <Alert severity="error" sx={{ alignSelf: "stretch" }}>
          {state.reason}
        </Alert>
      ) : null}
    </Stack>
  );
};
