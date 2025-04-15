import {
  ProductDetailType,
  type ProductDmProjectTier,
  type ProductUnitGetResponseProduct,
} from "@squonk/account-server-client";
import { useGetProduct } from "@squonk/account-server-client/product";

import { Button, Typography } from "@mui/material";

import { formatCoins } from "../../utils/app/coins";
import { projectURL } from "../../utils/app/routes";

// Type guard function to check if a product is ProductDmProjectTier
function isProductDmProjectTier(
  product: ProductUnitGetResponseProduct | null | undefined,
): product is ProductDmProjectTier {
  return (
    !!product && // Check if product is defined
    product.product.type === ProductDetailType.DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION
  );
}

export interface ProcessingChargeMessageProps {
  name: string;
  coins: string;
  product: string;
}

export const ProcessingChargeMessage = ({ coins, product }: ProcessingChargeMessageProps) => {
  const { data: productData } = useGetProduct(product, {
    query: { select: (data) => data.product },
  });

  if (productData && isProductDmProjectTier(productData) && productData.claim) {
    return (
      <div>
        <Typography component="h5" variant="h5">
          Processing Charge
        </Typography>

        <Typography>
          <Button
            color="secondary"
            href={projectURL(productData.claim.id)}
            rel="noreferrer"
            sx={{ textTransform: "none" }}
            target="_blank"
            variant="text"
          >
            {productData.claim.name}
          </Button>{" "}
          was charged {formatCoins(coins)}
        </Typography>
      </div>
    );
  }
};
