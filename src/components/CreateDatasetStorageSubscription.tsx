import { type AsError, type UnitAllDetail } from "@squonk/account-server-client";
import {
  getGetProductsQueryKey,
  useCreateUnitProduct,
} from "@squonk/account-server-client/product";

import { Box, Button, TextField } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { useGetStorageCost } from "../hooks/useGetStorageCost";
import { formatCoins } from "../utils/app/coins";

export interface CreateDatasetStorageSubscriptionProps {
  unit: UnitAllDetail;
}

// Define Zod schema for validation
const productSchema = z.object({
  name: z.string().min(1, "A name is required"),
  allowance: z.number().min(1, "Allowance must be at least 1").int("Allowance must be an integer"),
});

export const CreateDatasetStorageSubscription = ({
  unit,
}: CreateDatasetStorageSubscriptionProps) => {
  const { mutateAsync: createProduct } = useCreateUnitProduct();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();
  const queryClient = useQueryClient();
  const cost = useGetStorageCost();

  const form = useForm({
    defaultValues: { name: "Dataset Storage", allowance: 1000 },
    validators: { onChange: productSchema },
    onSubmit: async ({ value }) => {
      try {
        await createProduct({
          unitId: unit.id,
          data: {
            allowance: value.allowance,
            limit: value.allowance, // TODO: we will implement this properly later
            name: value.name,
            type: "DATA_MANAGER_STORAGE_SUBSCRIPTION",
          },
        });
        enqueueSnackbar("Created product", { variant: "success" });
        await queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        form.reset();
      } catch (error) {
        enqueueError(error);
        captureException(error);
      }
    },
  });

  return (
    <Box sx={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 2 }}>
      <form.Field name="name">
        {(field) => (
          <TextField
            autoFocus
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            error={field.state.meta.errors?.length > 0}
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            helperText={field.state.meta.errors?.map((error) => error?.message)[0]}
            label="Name"
            sx={{ maxWidth: 150 }}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="allowance">
        {(field) => (
          <TextField
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            error={field.state.meta.errors?.length > 0}
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            helperText={field.state.meta.errors?.map((error) => error?.message)[0]}
            label="Allowance"
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ maxWidth: 100 }}
            type="number"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(Number(e.target.value))}
          />
        )}
      </form.Field>

      {!!cost && <span>Cost: {formatCoins(cost * form.state.values.allowance)}</span>}

      <Button disabled={!form.state.canSubmit} onClick={() => void form.handleSubmit()}>
        Create
      </Button>
    </Box>
  );
};
