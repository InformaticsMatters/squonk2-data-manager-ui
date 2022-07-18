import { useQueryClient } from "react-query";

import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitsQueryKey,
  useDeleteDefaultUnit,
} from "@squonk/account-server-client/unit";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { ListItem, ListItemText } from "@mui/material";

import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../state/unitSelection";
import { WarningDeleteButton } from "../../../../WarningDeleteButton";

export const DeleteUnitListItem = () => {
  const [unit, setUnit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteUnit, isLoading: isDeleting } = useDeleteDefaultUnit();

  return (
    <WarningDeleteButton
      modalId={`delete-${unit?.id}`}
      title="Delete Unit"
      tooltipText="Delete selected unit"
      onDelete={async () => {
        await deleteUnit();
        setUnit();
        organisation?.id &&
          queryClient.invalidateQueries(getGetOrganisationUnitsQueryKey(organisation.id));
        queryClient.invalidateQueries(getGetUnitsQueryKey());
      }}
    >
      {({ openModal }) => (
        <ListItem button disabled={unit === undefined || isDeleting} onClick={() => openModal()}>
          <ListItemText primary="Delete Unit" secondary="Deletes the selected unit" />
          <DeleteForeverIcon color="action" />
        </ListItem>
      )}
    </WarningDeleteButton>
  );
};
