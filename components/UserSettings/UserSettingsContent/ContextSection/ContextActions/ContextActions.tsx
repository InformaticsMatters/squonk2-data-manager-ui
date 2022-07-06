import { List } from "@mui/material";

import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../state/unitSelection";
import { CreateProjectListItem } from "./CreateProjectListItem";
import { CreateUnitListItem } from "./CreateUnitListItem";

/**
 * Displays actions related to context.
 */
export const ContextActions = () => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const { user } = useKeycloakUser();

  const isOrganisationOwner = organisation?.owner_id === user.username;

  return (
    <List>
      {(isOrganisationOwner || organisation?.caller_is_member) &&
        organisation?.name !== process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME && <CreateUnitListItem />}
      {unit && <CreateProjectListItem />}
    </List>
  );
};
