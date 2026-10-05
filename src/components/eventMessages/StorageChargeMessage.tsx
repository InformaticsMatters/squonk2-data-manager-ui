import { Typography } from "@mui/material";
import { filesize } from "filesize";

import { StorageReasonEnum } from "../../protobuf/gen/merchant_storage_charge_message_pb";
import { StorageIcon } from "../icons";

export interface StorageChargeMessageProps {
  name: string;
  bytes: string;
  reason: StorageReasonEnum;
}

export const StorageChargeMessage = ({ bytes, reason }: StorageChargeMessageProps) => {
  const parsedBytes = Number.parseInt(bytes.replace(/,/gu, ""), 10);

  return (
    <div>
      <Typography
        gutterBottom
        component="h5"
        sx={{ alignItems: "center", display: "flex", gap: 1 }}
        variant="h5"
      >
        <StorageIcon />
        Storage Charge
      </Typography>

      <Typography>
        {reason === StorageReasonEnum.DATASET ? "Dataset" : "Project"} storage charge.{" "}
        {filesize(parsedBytes)} consumed.
      </Typography>
    </div>
  );
};
