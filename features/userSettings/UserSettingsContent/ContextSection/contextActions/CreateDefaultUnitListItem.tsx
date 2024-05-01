import {
  getGetUnitsQueryKey,
  getUnit,
  useCreateDefaultUnit,
} from "@squonk/account-server-client/unit";

import { CreateNewFolder } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useSelectedUnit } from "../../../../../state/unitSelection";
import { getBillingDay } from "../../../../../utils/app/products";

export const CreateDefaultUnitListItem = () => {
  const { mutateAsync: createPersonalUnit } = useCreateDefaultUnit();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const queryClient = useQueryClient();
  const [, setUnit] = useSelectedUnit();

  const createDefaultUnitHandler = async () => {
    try {
      const { id } = await createPersonalUnit({
        data: { billing_day: getBillingDay() },
      });
      enqueueSnackbar("Personal unit created", { variant: "success" });
      void queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey() });

      const unit = await getUnit(id);
      setUnit(unit);
    } catch (error) {
      enqueueError(error);
    }
  };

  return (
    <ListItemButton onClick={() => void createDefaultUnitHandler()}>
      <ListItemText
        primary="Create personal unit"
        secondary="Create a new unit in the default organisation"
      />
      <ListItemIcon>
        <CreateNewFolder color="action" />
      </ListItemIcon>
    </ListItemButton>
  );
};
