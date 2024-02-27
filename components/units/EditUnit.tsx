import { useState } from "react";

import type { UnitDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitQueryKey,
  getGetUnitsQueryKey,
  usePatchUnit,
} from "@squonk/account-server-client/unit";
import { getGetProjectsQueryKey } from "@squonk/data-manager-client/project";

import { Box, Button, TextField } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { getErrorMessage } from "../../utils/next/orvalError";

export interface EditUnitProps {
  unit: UnitDetail;
}

export const EditUnit = ({ unit }: EditUnitProps) => {
  const [organisation] = useSelectedOrganisation();
  const [, setUnit] = useSelectedUnit();
  const [name, setName] = useState(unit.name);

  const { mutateAsync: patchUnit, isPending } = usePatchUnit();

  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  return (
    <Box display="flex" gap={1}>
      <TextField
        fullWidth
        label="Unit Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        disabled={isPending || name === unit.name}
        onClick={async () => {
          try {
            await patchUnit({
              unitId: unit.id,
              data: { name },
            });

            await Promise.all([
              queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey() }),
              queryClient.invalidateQueries({ queryKey: getGetUnitQueryKey(unit.id) }),
              queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() }),
              new Promise((resolve, reject) => {
                if (!organisation?.id) {
                  return resolve(null);
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
        }}
      >
        Update
      </Button>
    </Box>
  );
};
