import { List, Typography } from "@mui/material";

import { useOrganisationUnit } from "../../../../../context/organisationUnitContext";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { CreateProjectListItem } from "./CreateProjectListItem";
import { CreateUnitListItem } from "./CreateUnitListItem";

/**
 * Displays actions related to context.
 */
export const ContextActions = () => {
  const {
    organisationUnit: { organisation, unit },
  } = useOrganisationUnit();
  const { user } = useKeycloakUser();

  const isOrganisationOwner = organisation?.owner_id === user.username;

  if (!unit && !isOrganisationOwner) {
    return (
      <Typography component="p" sx={{ mt: 1 }} variant="subtitle2">
        Please select an organisation and a unit
      </Typography>
    );
  }

  return (
    <List>
      {(isOrganisationOwner || organisation?.caller_is_member) && <CreateUnitListItem />}
      <CreateProjectListItem />
    </List>
  );
};
