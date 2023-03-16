import { List } from "@mui/material";

import { CreateProjectListItem } from "../../../../../components/projects/CreateProjectListItem";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../state/unitSelection";
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

  return (
    <List sx={{ width: "100%" }}>
      {isUnitOwner && unit && (
        <DeleteUnitListItem unit={unit} onDelete={() => setUnit(undefined)} />
      )}
      {isUnitOwner && unit && organisation?.name !== "Default" && <EditUnitListItem unit={unit} />}
      {unit && <CreateProjectListItem unit={unit} />}
    </List>
  );
};
