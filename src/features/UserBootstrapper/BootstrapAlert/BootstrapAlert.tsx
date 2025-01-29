import { Alert, Box } from "@mui/material";

import { useGetPersonalUnit } from "../../../hooks/useGetPersonalUnit";
import { BootstrapForm } from "./BootstrapForm";

/**
 * Bootstraps a user which doesn't have any units with a default unit and a project
 */
export const BootstrapAlert = () => {
  const { data: unit, isLoading } = useGetPersonalUnit();

  if (isLoading) {
    return null;
  }

  if (!unit) {
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
