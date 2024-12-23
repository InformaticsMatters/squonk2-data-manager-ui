import { useState } from "react";

import { type ProductDetail } from "@squonk/account-server-client";
import {
  getGetProductQueryKey,
  getGetProductsQueryKey,
  usePatchProduct,
} from "@squonk/account-server-client/product";

import { Edit as EditIcon } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Field } from "formik";
import { TextField } from "formik-mui";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useGetStorageCost } from "../../hooks/useGetStorageCost";
import { formatCoins } from "../../utils/app/coins";
import { FormikModalWrapper } from "../modals/FormikModalWrapper";

export interface AdjustProjectProductProps {
  product: ProductDetail;
  allowance: number;
}

export const AdjustProjectProduct = ({ product, allowance }: AdjustProjectProductProps) => {
  const [open, setOpen] = useState(false);
  const cost = useGetStorageCost();
  const { mutateAsync: adjustProduct } = usePatchProduct();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const queryClient = useQueryClient();

  const initialValues = { name: product.name, allowance };

  return (
    <>
      <IconButton size="small" sx={{ p: "1px" }} onClick={() => setOpen(true)}>
        <EditIcon />
      </IconButton>
      <FormikModalWrapper
        id={`adjust-${product.id}`}
        initialValues={initialValues}
        open={open}
        submitText="Submit"
        title={`Adjust Product - ${product.name}`}
        onClose={() => setOpen(false)}
        onSubmit={async (values) => {
          try {
            await adjustProduct({ productId: product.id, data: values });
            await Promise.allSettled([
              queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }),
              queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(product.id) }),
            ]);
            enqueueSnackbar("Updated product", { variant: "success" });
          } catch (error) {
            enqueueError(error);
          }
        }}
      >
        {({ values }) => (
          <Box sx={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 2, m: 2 }}>
            <Field
              autoFocus
              component={TextField}
              label="Name"
              name="name"
              sx={{ maxWidth: 150 }}
            />
            <Field
              component={TextField}
              label="Allowance"
              min={1}
              name="allowance"
              sx={{ maxWidth: 100 }}
              type="number"
            />
            {!!cost && <span>Cost: {formatCoins(cost * values.allowance).slice(1)}C</span>}
          </Box>
        )}
      </FormikModalWrapper>
    </>
  );
};
