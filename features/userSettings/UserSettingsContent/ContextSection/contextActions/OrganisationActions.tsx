import { List } from "@mui/material";

import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { CreateOrganisationListItem } from "./CreateOrganisationListItem";
import { CreateUnitListItem } from "./CreateUnitListItem";
import { EditOrganisationListItem } from "./EditOrganisationListItem";

const adminRole = process.env.NEXT_PUBLIC_KEYCLOAK_AS_ADMIN_ROLE;

/**
 * Displays actions related to organisations.
 */
export const OrganisationActions = () => {
  const [organisation] = useSelectedOrganisation();
  const { user } = useKeycloakUser();

  const hasAdminRole = adminRole && user.roles?.includes(adminRole);

  const isOrganisationOwner = organisation?.owner_id === user.username;

  return (
    <List sx={{ width: "100%" }}>
      {hasAdminRole && <CreateOrganisationListItem />}
      {isOrganisationOwner && organisation && organisation.name !== "Default" && (
        <EditOrganisationListItem organisation={organisation} />
      )}
      {(isOrganisationOwner || organisation?.caller_is_member) &&
        organisation?.name !== process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME && <CreateUnitListItem />}
    </List>
  );
};
