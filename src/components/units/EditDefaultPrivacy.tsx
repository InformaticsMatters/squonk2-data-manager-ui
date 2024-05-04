import { type UnitDetail, UnitDetailDefaultProductPrivacy } from "@squonk/account-server-client";
import {
  getGetUnitQueryKey,
  getGetUnitsQueryKey,
  usePatchUnit,
} from "@squonk/account-server-client/unit";

import { MenuItem, TextField } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { capitalise, shoutSnakeToLowerCase } from "../../utils/app/language";

export interface EditDefaultPrivacyProps {
  unit: UnitDetail;
}

export const EditDefaultPrivacy = ({ unit }: EditDefaultPrivacyProps) => {
  const { user } = useKeycloakUser();

  const [organisation] = useSelectedOrganisation();
  const [, setUnit] = useSelectedUnit();

  const { mutateAsync: patchUnit, isPending } = usePatchUnit();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const queryClient = useQueryClient();

  const handleSelection = async (newValue: UnitDetailDefaultProductPrivacy) => {
    try {
      await patchUnit({
        unitId: unit.id,
        data: {
          default_product_privacy: newValue,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetUnitQueryKey(unit.id) });
      enqueueSnackbar("Unit default privacy updated", { variant: "success" });

      const newUnit = { ...unit, default_product_privacy: newValue } satisfies UnitDetail;
      setUnit(newUnit);
    } catch (error) {
      enqueueError(error);
    }
  };

  // const isOrganisationMember = organisation?.caller_is_member;
  const isUnitOwner = unit.owner_id === user.username;
  const isPersonalUnit = organisation?.name === process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME;

  // const allowedToEdit = !isPersonalUnit && (isUnitOwner || isOrganisationMember);
  const allowedToEdit = !isPersonalUnit && isUnitOwner;

  const helperText = isPersonalUnit
    ? "Default project privacy of personal units may not be changed"
    : allowedToEdit
      ? undefined
      : "You must be the unit owner or have the admin role to edit the unit default project privacy";

  return (
    <TextField
      select
      disabled={isPending || !allowedToEdit}
      helperText={helperText}
      label="Default project privacy"
      value={unit.default_product_privacy}
      onChange={(event) =>
        void handleSelection(event.target.value as UnitDetailDefaultProductPrivacy)
      }
    >
      {Object.values(UnitDetailDefaultProductPrivacy).map((rule) => (
        <MenuItem key={rule} value={rule}>
          {capitalise(shoutSnakeToLowerCase(rule))}
        </MenuItem>
      ))}
    </TextField>
  );
};
