import { type ProductDetail } from "@/api/account-server";

import { Receipt as ReceiptIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { withBasePath } from "../../utils/app/basePath";

export interface ChargesLinkIconButtonProps {
  productId?: ProductDetail["id"];
}

export const ChargesLinkIconButton = ({ productId }: ChargesLinkIconButtonProps) => {
  return (
    <Tooltip title="View charges">
      <span>
        <IconButton
          disabled={!productId}
          href={withBasePath(`/product/${productId}/charges`)}
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
