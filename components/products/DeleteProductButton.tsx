import type { ProductDetail } from "@squonk/account-server-client";
import {
  getGetProductQueryKey,
  getGetProductsQueryKey,
  useDeleteProduct,
} from "@squonk/account-server-client/product";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { getErrorMessage } from "../../utils/next/orvalError";
import { WarningDeleteButton } from "../WarningDeleteButton";

export interface DeleteProductButtonProps {
  product: ProductDetail;
  disabled?: boolean;
  tooltip: string;
}

export const DeleteProductButton = ({
  product,
  disabled = false,
  tooltip,
}: DeleteProductButtonProps) => {
  const { mutateAsync: deleteProduct } = useDeleteProduct();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const queryClient = useQueryClient();
  return (
    <WarningDeleteButton
      modalId={`delete-${product.id}`}
      title="Delete Product"
      tooltipText={tooltip}
      onDelete={async () => {
        try {
          await deleteProduct({ productId: product.id });
          await Promise.allSettled([
            queryClient.invalidateQueries(getGetProductsQueryKey()),
            queryClient.invalidateQueries(getGetProductQueryKey(product.id)),
          ]);
          enqueueSnackbar("Product deleted", { variant: "success" });
        } catch (error) {
          enqueueError(getErrorMessage(error));
          captureException(error);
        }
      }}
    >
      {({ openModal }) => (
        <IconButton disabled={disabled} size="small" sx={{ p: "1px" }} onClick={openModal}>
          <DeleteForeverIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
