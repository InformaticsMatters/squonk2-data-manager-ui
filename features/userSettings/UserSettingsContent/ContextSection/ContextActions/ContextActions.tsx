import { List } from "@mui/material";

import { CreateProjectListItem } from "../../../../../components/projects/CreateProjectListItem";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../state/unitSelection";
import { CreateUnitListItem } from "./CreateUnitListItem";
import { DeleteUnitListItem } from "./DeleteUnitListItem";

/**
 * Displays actions related to context.
 */
export const ContextActions = () => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const { user } = useKeycloakUser();

  const isOrganisationOwner = organisation?.owner_id === user.username;
  const isUnitOwner = user.username === unit?.owner_id;

  return (
    <List>
      {(isOrganisationOwner || organisation?.caller_is_member) &&
        organisation?.name !== process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME && <CreateUnitListItem />}
      {isUnitOwner && <DeleteUnitListItem />}
      {unit && <CreateProjectListItem unit={unit} />}
    </List>
  );
};
