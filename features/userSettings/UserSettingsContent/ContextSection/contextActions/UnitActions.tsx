import { List } from "@mui/material";

import { CreateProjectListItem } from "../../../../../components/projects/CreateProjectListItem";
import { useGetPersonalUnit } from "../../../../../hooks/useGetPersonalUnit";
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

  return (
    <List sx={{ width: "100%" }}>
      {(isOrganisationOwner || organisation?.caller_is_member) &&
        organisation?.name !== process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME && <CreateUnitListItem />}
      {personalUnit === undefined &&
        !isLoading &&
        !error &&
        organisation?.name === process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME && (
          <CreateDefaultUnitListItem />
        )}
      {isUnitOwner && unit && (
        <DeleteUnitListItem unit={unit} onDelete={() => setUnit(undefined)} />
      )}
      {isUnitOwner && unit && organisation?.name !== process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME && (
        <EditUnitListItem unit={unit} />
      )}
      {unit && (unit.caller_is_member || unit.owner_id === user.username) && (
        <CreateProjectListItem unit={unit} />
      )}
    </List>
  );
};
