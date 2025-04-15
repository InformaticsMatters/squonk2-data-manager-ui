import { fromJson } from "@bufbuild/protobuf";

import {
  type MerchantAuthorityRequestResponseMessage,
  MerchantAuthorityRequestResponseMessageSchema,
} from "./gen/merchant_authority_request_response_message_pb";
import {
  type MerchantProcessingChargeMessage,
  MerchantProcessingChargeMessageSchema,
} from "./gen/merchant_processing_charge_message_pb";
import {
  type MerchantStorageChargeMessage,
  MerchantStorageChargeMessageSchema,
  type StorageReasonEnum,
} from "./gen/merchant_storage_charge_message_pb";

// --- Type Helpers for Prefixed Message Name ---
// Helper to get the last segment after the last dot
type GetLastSegment<S extends string> = S extends `${string}.${infer R}`
  ? GetLastSegment<R> extends ""
    ? R
    : GetLastSegment<R>
  : S;

// Helper to get the string before the last segment
type GetBeforeLastSegment<S extends string, Last extends string = GetLastSegment<S>> =
    S extends `${infer Head}.${Last}` ? Head : "";

// Helper to get the second-to-last segment
type GetSecondLastSegment<S extends string> = GetLastSegment<GetBeforeLastSegment<S>>;

// Helper to remove "Message" suffix
type RemoveMessageSuffix<S extends string> = S extends `${infer Base}Message` ? Base : S;

// Combined type helper for "Segment.BaseName" format
type ExtractPrefixedMessageName<S extends string> =
    GetSecondLastSegment<S> extends ""
    ? RemoveMessageSuffix<GetLastSegment<S>> // If no second last segment, just return the modified last one
    : `${GetSecondLastSegment<S>}.${RemoveMessageSuffix<GetLastSegment<S>>}`;
// --- End Type Helpers ---

// --- Define Derived Literal Types using MessageType["$typeName"] ---
type AuthorityTypeName = ExtractPrefixedMessageName<MerchantAuthorityRequestResponseMessage["$typeName"]>;
type ProcessingTypeName = ExtractPrefixedMessageName<MerchantProcessingChargeMessage["$typeName"]>;
type StorageTypeName = ExtractPrefixedMessageName<MerchantStorageChargeMessage["$typeName"]>;
// --- End Derived Literal Types ---

// --- Runtime Helper for Prefixed Message Name ---
function getPrefixedMessageNameFromSchema(schema: { typeName: string }): string {
  const typeName = schema.typeName; // Use the runtime string property
  const parts = typeName.split(".");
  if (parts.length === 0) {
    return ""; // Or handle error
  }
  const lastPart = parts.at(-1) ?? "";
  const baseName = lastPart.replace(/Message$/u, "");

  if (parts.length === 1) {
    return baseName; // No prefix available
  }

  const secondLastPart = parts.at(-2) ?? "";
  return `${secondLastPart}.${baseName}`;
}
// --- End Runtime Helper ---

// --- Runtime Constants Typed with Derived Literals ---
export const authorityType = getPrefixedMessageNameFromSchema(
  MerchantAuthorityRequestResponseMessageSchema,
) as AuthorityTypeName;

export const processingType = getPrefixedMessageNameFromSchema(
  MerchantProcessingChargeMessageSchema,
) as ProcessingTypeName;

export const storageType = getPrefixedMessageNameFromSchema(
  MerchantStorageChargeMessageSchema,
) as StorageTypeName;
// --- End Runtime Constants ---


type ProcessingMessagePayload = {
  type: ProcessingTypeName;
  name: string;
  coins: string;
  product: string;
};

type StorageMessagePayload = {
  type: StorageTypeName;
  name: string;
  bytes: string;
  reason: StorageReasonEnum;
};

// Discriminated union type representing the possible charge message payloads
// derived from Protobuf messages (Processing or Storage).
export type ChargeMessage = ProcessingMessagePayload | StorageMessagePayload;

interface EventStreamMessage {
  message_type: string;
  message_body: any;
}

/**
 * Converts a Blob containing JSON text into an EventStreamMessage object.
 * @param blob The Blob containing the JSON text.
 * @returns A Promise resolving to the parsed EventStreamMessage object.
 */
export const protoBlobToText = async (blob: Blob) => {
  const text = await blob.text();
  const json = JSON.parse(text);
  return json as EventStreamMessage;
};

/**
 * Parses an EventStreamMessage and returns a typed ChargeMessage payload
 * based on the message_type, or null if the type is unhandled.
 * @param event The raw EventStreamMessage containing the message type and body.
 * @returns A typed ChargeMessage (ProcessingMessagePayload or StorageMessagePayload),
 *          or null if the message type is not recognized or handled.
 */
export const getMessageFromEvent = (event: EventStreamMessage): ChargeMessage | null => {
  // Compare message_type against the runtime constants (which have literal types)
  switch (event.message_type) {
    case authorityType: {
      // const parsed = fromJson(MerchantAuthorityRequestResponseMessageSchema, event.message_body).product;
      return null;
    }
    case processingType: {
      const parsed = fromJson(MerchantProcessingChargeMessageSchema, event.message_body);
      return {
        type: processingType,
        name: parsed.name,
        coins: parsed.coins,
        product: parsed.product
      };
    }
    case storageType: {
      const parsed = fromJson(MerchantStorageChargeMessageSchema, event.message_body);
      return {
        type: storageType,
        name: parsed.name,
        bytes: parsed.bytes,
        reason: parsed.reason,
      };
    }
    default:
      return null;
  }
};
