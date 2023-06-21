import { useGetUnits } from "@squonk/account-server-client/unit";

import { Alert, Box } from "@mui/material";

import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { BootstrapForm } from "./BootstrapForm";
/**
 * Bootstraps a user which doesn't have any units with a default unit and a project
 */
export const BootstrapAlert = () => {
  const { data: unitsData, isLoading: isLoadingUnits } = useGetUnits();
  const { user } = useKeycloakUser();

  const userDefaultUnit = unitsData?.units
    .find((orgUnit) => orgUnit.organisation.name === "Default")
    ?.units.find((unit) => unit.owner_id === user.username);

  if (isLoadingUnits) {
    return null;
  }

  if (!userDefaultUnit) {
    return (
      <Box m={2}>
        <Alert
          severity="info"
          sx={{
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
        >
          You do not have a personal unit. You may create one and populate it with a project.
          <BootstrapForm />
        </Alert>
      </Box>
    );
  }

  return null;
};
