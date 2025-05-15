import { List } from "@mui/material";

import { CreateProjectListItem } from "../../../../../components/projects/CreateProject/CreateProjectListItem";
import { useGetPersonalUnit } from "../../../../../hooks/useGetPersonalUnit";
import { useASAuthorizationStatus } from "../../../../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../state/unitSelection";
import { CreateDefaultUnitListItem } from "./CreateDefaultUnitListItem";
import { CreateUnitListItem } from "./CreateUnitListItem";
import { DeleteUnitListItem } from "./DeleteUnitListItem";
import { EditUnitListItem } from "./EditUnitListItem";

/**
 * Displays actions related to units.
 */
export const UnitActions = () => {
  const [unit, setUnit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const { user } = useKeycloakUser();

  const isUnitOwner = user.username === unit?.owner_id;

  const isOrganisationOwner = organisation?.owner_id === user.username;

  const { data: personalUnit, isLoading, error } = useGetPersonalUnit();

  const isAdminUser = useASAuthorizationStatus() === process.env.NEXT_PUBLIC_KEYCLOAK_AS_ADMIN_ROLE;

  const organisationIsDefault = organisation?.name === process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME;

  return (
    <List sx={{ width: "100%" }}>
      {!!(isAdminUser || isOrganisationOwner || !!organisation?.caller_is_member) &&
        !organisationIsDefault && <CreateUnitListItem />}
      {personalUnit === undefined && !isLoading && !error && !!organisationIsDefault && (
        <CreateDefaultUnitListItem />
      )}
      {!!(isAdminUser || isUnitOwner) && !!unit && (
        <DeleteUnitListItem unit={unit} onDelete={() => setUnit(undefined)} />
      )}
      {!!unit && <EditUnitListItem unit={unit} />}
      {!!unit && !!(unit.caller_is_member || unit.owner_id === user.username) && (
        <CreateProjectListItem unit={unit} />
      )}
    </List>
  );
};
