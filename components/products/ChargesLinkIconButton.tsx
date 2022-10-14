import type { ProductDetail } from "@squonk/account-server-client";

import ReceiptIcon from "@mui/icons-material/Receipt";
import { IconButton, Tooltip } from "@mui/material";
import NextLink from "next/link";

export interface ChargesLinkIconButtonProps {
  productId: ProductDetail["id"];
}

export const ChargesLinkIconButton = ({ productId }: ChargesLinkIconButtonProps) => {
  return (
    <NextLink
      passHref
      href={{
        pathname: "/product/[productId]/invoice",
        query: { productId },
      }}
    >
      <Tooltip title="View charges">
        <span>
          <IconButton size="small">
            <ReceiptIcon />
          </IconButton>
        </span>
      </Tooltip>
    </NextLink>
  );
};
