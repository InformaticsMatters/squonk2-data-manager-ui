import { useEffect, useState } from "react";

import { type ProductDetail } from "@squonk/account-server-client";
import {
  getGetProductQueryKey,
  getGetProductsQueryKey,
  usePatchProduct,
} from "@squonk/account-server-client/product";

import { Edit as EditIcon } from "@mui/icons-material";
import { Box, IconButton, TextField } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useGetStorageCost } from "../../hooks/useGetStorageCost";
import { formatCoins } from "../../utils/app/coins";
import { FormModalWrapper } from "../modals/FormModalWrapper";

export interface AdjustProjectProductProps {
  product: ProductDetail;
  allowance: number;
}

// Define Zod schema for validation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  allowance: z.number().min(1, "Allowance must be at least 1"),
});

export const AdjustProjectProduct = ({ product, allowance }: AdjustProjectProductProps) => {
  const [open, setOpen] = useState(false);
  const [currentAllowance, setCurrentAllowance] = useState(allowance);

  const cost = useGetStorageCost();
  const { mutateAsync: adjustProduct } = usePatchProduct();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: { name: product.name, allowance },
    validators: { onChange: formSchema },
    onSubmit: (values) => {
      return adjustProduct({
        productId: product.id,
        data: values.value,
      })
        .then(() => {
          return Promise.allSettled([
            queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(product.id) }),
          ]);
        })
        .then(() => {
          enqueueSnackbar("Updated product", { variant: "success" });
          setOpen(false);
          return {};
        })
        .catch((error) => {
          enqueueError(error);
          return {};
        });
    },
  });

  const formWrapper = {
    handleSubmit: () => form.handleSubmit(),
    reset: () => {
      form.reset();
      setCurrentAllowance(allowance);
    },
    state: {
      canSubmit: form.state.canSubmit,
      isSubmitting: form.state.isSubmitting,
    },
  };

  useEffect(() => {
    if (!open) {
      setCurrentAllowance(allowance);
    }
  }, [open, allowance]);

  return (
    <>
      <IconButton size="small" sx={{ p: "1px" }} onClick={() => setOpen(true)}>
        <EditIcon />
      </IconButton>
      <FormModalWrapper
        form={formWrapper}
        id={`adjust-${product.id}`}
        open={open}
        submitText="Submit"
        title={`Adjust Product - ${product.name}`}
        onClose={() => setOpen(false)}
      >
        <Box sx={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 2, m: 2 }}>
          <form.Field name="name">
            {(field) => (
              <TextField
                autoFocus
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors[0]?.message}
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
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors[0]?.message}
                label="Allowance"
                slotProps={{ htmlInput: { min: 1 } }}
                sx={{ maxWidth: 100 }}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const newValue = Number(e.target.value);
                  field.handleChange(newValue);
                  setCurrentAllowance(newValue);
                }}
              />
            )}
          </form.Field>
          {!!cost && <span>Cost: {formatCoins(cost * currentAllowance).slice(1)}C</span>}
        </Box>
      </FormModalWrapper>
    </>
  );
};
