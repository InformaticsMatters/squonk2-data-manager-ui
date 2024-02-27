import type { UnitDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitsQueryKey,
  useDeleteDefaultUnit,
  useDeleteOrganisationUnit,
} from "@squonk/account-server-client/unit";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { useQueryClient } from "@tanstack/react-query";

import { WarningDeleteButton } from "../../../../../components/WarningDeleteButton";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";

export interface DeleteUnitListItem {
  unit: UnitDetail;
  /**
   * Called when deletion _completes successfully_
   */
  onDelete: () => void;
}

export const DeleteUnitListItem = ({ unit, onDelete }: DeleteUnitListItem) => {
  const { user } = useKeycloakUser();
  const [organisation] = useSelectedOrganisation();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteDefaultUnit, isPending: isDefaultDeleting } = useDeleteDefaultUnit();
  const { mutateAsync: deleteUnit, isPending: isUnitDeleting } = useDeleteOrganisationUnit();
  const isDeleting = isDefaultDeleting || isUnitDeleting;

  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  return (
    <WarningDeleteButton
      modalId={`delete-${unit.id}`}
      title="Delete Unit"
      tooltipText="Delete selected unit"
      onDelete={async () => {
        try {
          if (unit.name === user.username) {
            await deleteDefaultUnit();
          } else {
            await deleteUnit({ unitId: unit.id });
          }
          enqueueSnackbar("Unit deleted", { variant: "success" });
          onDelete();
        } catch (error) {
          enqueueError(error);
          captureException(error);
        }
        organisation?.id &&
          queryClient.invalidateQueries({
            queryKey: getGetOrganisationUnitsQueryKey(organisation.id),
          });
        queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey() });
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
