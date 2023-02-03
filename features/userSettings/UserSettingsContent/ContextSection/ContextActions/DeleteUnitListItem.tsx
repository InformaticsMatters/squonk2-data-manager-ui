import type { UnitDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitsQueryKey,
  useDeleteDefaultUnit,
} from "@squonk/account-server-client/unit";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WarningDeleteButton } from "../../../../../components/WarningDeleteButton";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { getErrorMessage } from "../../../../../utils/next/orvalError";

export interface DeleteUnitListItem {
  unit: UnitDetail;
  onDelete: () => void;
}

export const DeleteUnitListItem = ({ unit, onDelete }: DeleteUnitListItem) => {
  const [organisation] = useSelectedOrganisation();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteUnit, isLoading: isDeleting } = useDeleteDefaultUnit();
  const { enqueueError } = useEnqueueError();

  return (
    <WarningDeleteButton
      modalId={`delete-${unit.id}`}
      title="Delete Unit"
      tooltipText="Delete selected unit"
      onDelete={async () => {
        try {
          await deleteUnit();
          onDelete();
        } catch (error) {
          enqueueError(getErrorMessage(error));
        }
        organisation?.id &&
          queryClient.invalidateQueries(getGetOrganisationUnitsQueryKey(organisation.id));
        queryClient.invalidateQueries(getGetUnitsQueryKey());
      }}
    >
      {({ openModal }) => (
        <ListItemButton disabled={isDeleting} onClick={() => openModal()}>
          <ListItemText primary="Delete Unit" secondary="Deletes the selected unit" />
          <ListItemIcon>
            <DeleteForeverIcon color="action" />
          </ListItemIcon>
        </ListItemButton>
      )}
    </WarningDeleteButton>
  );
};
