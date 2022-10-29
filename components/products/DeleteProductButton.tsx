import type { ProductDetail } from "@squonk/account-server-client";
import {
  getGetProductQueryKey,
  getGetProductsQueryKey,
  useDeleteProduct,
} from "@squonk/account-server-client/product";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { IconButton, Tooltip } from "@mui/material";
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
    <Tooltip title={tooltip}>
      <span>
        <WarningDeleteButton
          modalId={`delete-${product.id}`}
          title="Delete Product"
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
            }
          }}
        >
          {({ openModal }) => (
            <IconButton disabled={disabled} size="small" sx={{ p: "1px" }} onClick={openModal}>
              <DeleteForeverIcon />
            </IconButton>
          )}
        </WarningDeleteButton>
      </span>
    </Tooltip>
  );
};
