import { type ProductDetail } from "@/api/account-server";

import { Receipt as ReceiptIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { administrationLinks } from "../../administration/routes";
import { isProductId } from "../../routing/identifiers";
import { withBasePath } from "../../utils/app/basePath";

export interface ChargesLinkIconButtonProps {
  productId?: ProductDetail["id"];
}

export const ChargesLinkIconButton = ({ productId }: ChargesLinkIconButtonProps) => {
  const productHref =
    productId && isProductId(productId)
      ? administrationLinks.chargeResource("products", productId)
      : undefined;

  return (
    <Tooltip title="View charges">
      <span>
        <IconButton
          disabled={!productHref}
          href={withBasePath(productHref ?? administrationLinks.charges())}
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
