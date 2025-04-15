import { Typography } from "@mui/material";
import { filesize } from "filesize";

import { StorageReasonEnum } from "../../protobuf/gen/merchant_storage_charge_message_pb";

export interface StorageChargeMessageProps {
  name: string;
  bytes: string;
  reason: StorageReasonEnum;
}

export const StorageChargeMessage = ({ bytes, reason }: StorageChargeMessageProps) => {
  const parsedBytes = Number.parseInt(bytes.replace(/,/gu, ""), 10);

  return (
    <div>
      <Typography gutterBottom component="h5" variant="h5">
        Storage Charge
      </Typography>

      <Typography>
        {reason === StorageReasonEnum.DATASET ? "Dataset" : "Project"} storage charge. {filesize(parsedBytes)} consumed.
      </Typography>
    </div>
  );
};
