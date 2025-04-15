import { type ChargeMessage, processingType, storageType } from "../../protobuf/protobuf";
import { ProcessingChargeMessage } from "./ProcessingChargeMessage";
import { StorageChargeMessage } from "./StorageChargeMessage";

export const EventMessage = ({ message }: { message: ChargeMessage }) => {
  switch (message.type) {
    case processingType:
      return <ProcessingChargeMessage {...message} />;
    case storageType:
      return <StorageChargeMessage {...message} />;
    default:
      return null;
  }
};
