import { useState } from "react";

import { type UnitAllDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitQueryKey,
  getGetUnitsQueryKey,
  usePatchUnit,
} from "@squonk/account-server-client/unit";
import { getGetProjectsQueryKey } from "@squonk/data-manager-client/project";

import { Box, Button, TextField } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { getErrorMessage } from "../../utils/next/orvalError";

export interface EditUnitProps {
  unit: UnitAllDetail;
}

export const EditUnitName = ({ unit }: EditUnitProps) => {
  const [organisation] = useSelectedOrganisation();
  const [, setUnit] = useSelectedUnit();
  const [name, setName] = useState(unit.name);

  const { mutateAsync: patchUnit, isPending } = usePatchUnit();

  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const updateHandler = async () => {
    try {
      await patchUnit({ unitId: unit.id, data: { name } });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetUnitQueryKey(unit.id) }),
        queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() }),
        new Promise((resolve, reject) => {
          if (!organisation?.id) {
            resolve(null);
            return;
          }

          queryClient
            .invalidateQueries({ queryKey: getGetOrganisationUnitsQueryKey(organisation.id) })
            .then(resolve)
            .catch(reject);
        }),
      ]);

      enqueueSnackbar("Unit updated", { variant: "success" });

      // need to set state here to force Autocomplete components to rerender properly
      const newUnit = { ...unit, name };
      setUnit(newUnit);
    } catch (error) {
      if ((error as AxiosError).isAxiosError) {
        enqueueError(getErrorMessage(error as AxiosError));
      } else {
        enqueueError("Failed to update unit");
      }
    }
  };

  const isOrganisationMember = organisation?.caller_is_member;
  const isUnitMember = unit.caller_is_member;
  const isPersonalUnit = organisation?.name === process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME;

  const allowedToEdit = !isPersonalUnit && (!!isOrganisationMember || isUnitMember);

  const helperText = isPersonalUnit
    ? "Names of personal units may not be changed"
    : allowedToEdit
      ? undefined
      : "You must be the unit owner to edit the unit name";

  return (
    <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
      <TextField
        fullWidth
        disabled={!allowedToEdit}
        helperText={helperText}
        label="Unit Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        disabled={isPending || name === unit.name || !allowedToEdit}
        onClick={() => void updateHandler()}
      >
        Update
      </Button>
    </Box>
  );
};
