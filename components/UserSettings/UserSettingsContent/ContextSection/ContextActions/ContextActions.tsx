import { List } from "@mui/material";

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

  return (
    <List>
      {(isOrganisationOwner || organisation?.caller_is_member) && <CreateUnitListItem />}
      {unit && <CreateProjectListItem />}
    </List>
  );
};
