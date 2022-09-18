import { useQueryClient } from "react-query";

import type { UnitDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitsQueryKey,
  useDeleteDefaultUnit,
} from "@squonk/account-server-client/unit";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { ListItem, ListItemText } from "@mui/material";

import { WarningDeleteButton } from "../../../../../components/WarningDeleteButton";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";

export interface DeleteUnitListItem {
  unit: UnitDetail;
  onDelete: () => void;
}

export const DeleteUnitListItem = ({ unit, onDelete }: DeleteUnitListItem) => {
  const [organisation] = useSelectedOrganisation();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteUnit, isLoading: isDeleting } = useDeleteDefaultUnit();

  return (
    <WarningDeleteButton
      modalId={`delete-${unit.id}`}
      title="Delete Unit"
      tooltipText="Delete selected unit"
      onDelete={async () => {
        await deleteUnit();
        onDelete();
        organisation?.id &&
          queryClient.invalidateQueries(getGetOrganisationUnitsQueryKey(organisation.id));
        queryClient.invalidateQueries(getGetUnitsQueryKey());
      }}
    >
      {({ openModal }) => (
        <ListItem button disabled={isDeleting} onClick={() => openModal()}>
          <ListItemText primary="Delete Unit" secondary="Deletes the selected unit" />
          <DeleteForeverIcon color="action" />
        </ListItem>
      )}
    </WarningDeleteButton>
  );
};
