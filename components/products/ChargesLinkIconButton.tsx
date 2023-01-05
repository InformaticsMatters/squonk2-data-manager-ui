import type { ProductDetail } from "@squonk/account-server-client";

import { Receipt as ReceiptIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

export interface ChargesLinkIconButtonProps {
  productId?: ProductDetail["id"];
}

export const ChargesLinkIconButton = ({ productId }: ChargesLinkIconButtonProps) => {
  return (
    <Tooltip title="View charges">
      <span>
        <IconButton
          disabled={!productId}
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/product/${productId}/charges`}
          size="small"
          sx={{ p: "1px" }}
          target="_blank"
        >
          <ReceiptIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};
