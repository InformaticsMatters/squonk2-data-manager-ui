import {
  type OrganisationUnitsGetResponse,
  ProductDetailType,
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetail,
  type UnitProductPostBodyBodyFlavour,
} from "@/api/account-server";

import { isAxiosError } from "axios";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { isProductId, isUnitId } from "../routing/identifiers";

export type ProjectCreationInput = {
  flavour: UnitProductPostBodyBodyFlavour;
  isPrivate: boolean;
  name: string;
  unitId: string;
};

const projectNamePattern = /^[A-Za-z0-9-_.][A-Za-z0-9-_. ]*[A-Za-z0-9-_.]$/u;

export const projectCreationNameIsValid = (name: string) =>
  name.length >= 2 && name.length <= 80 && projectNamePattern.test(name);

type SubscriptionOrigin = "created" | "handoff";
type Subscription = { origin: SubscriptionOrigin; productId: string };

export type ProjectCreationState =
  | { input: ProjectCreationInput; kind: "product-failed"; reason: string; retryable: boolean }
  | { kind: "cancelled" }
  | { kind: "cleaning-up"; input: ProjectCreationInput; productId: string }
  | { kind: "cleanup-failed"; productId: string; reason: string }
  | { kind: "collecting" }
  | { kind: "completed"; productId: string; projectId: string }
  | { kind: "creating-product"; input: ProjectCreationInput }
  | (Subscription & { input: ProjectCreationInput; kind: "creating-project" })
  | (Subscription & { input: ProjectCreationInput; kind: "project-failed"; reason: string });

export type ProjectCreationEffect =
  | { input: ProjectCreationInput; kind: "create-product" }
  | { kind: "delete-product"; productId: string }
  | (Pick<Subscription, "productId"> & { input: ProjectCreationInput; kind: "create-project" });

type ProjectCreationEvent =
  | { input: ProjectCreationInput; kind: "submit"; subscription?: Subscription }
  | { kind: "cancel" }
  | { kind: "cleanup-failed"; reason: string }
  | { kind: "cleanup-succeeded" }
  | { kind: "product-created"; productId: string }
  | { kind: "product-failed"; reason: string; retryable: boolean }
  | { kind: "project-created"; projectId: string }
  | { kind: "project-failed"; reason: string }
  | { kind: "retry" };

export type ProjectCreationTransition = {
  effect?: ProjectCreationEffect;
  state: ProjectCreationState;
};

export const initialProjectCreationState: ProjectCreationState = { kind: "collecting" };

/**
 * The cross-service lifecycle. The subscription identity is promoted into state before the project
 * request is allowed to begin, which makes every project retry reuse that subscription.
 */
export const transitionProjectCreation = (
  state: ProjectCreationState,
  event: ProjectCreationEvent,
): ProjectCreationTransition => {
  if (event.kind === "submit" && state.kind === "collecting") {
    if (event.subscription) {
      return {
        effect: {
          input: event.input,
          kind: "create-project",
          productId: event.subscription.productId,
        },
        state: { input: event.input, kind: "creating-project", ...event.subscription },
      };
    }
    return {
      effect: { input: event.input, kind: "create-product" },
      state: { input: event.input, kind: "creating-product" },
    };
  }
  if (event.kind === "product-created" && state.kind === "creating-product") {
    return {
      effect: { input: state.input, kind: "create-project", productId: event.productId },
      state: {
        input: state.input,
        kind: "creating-project",
        origin: "created",
        productId: event.productId,
      },
    };
  }
  if (event.kind === "product-failed" && state.kind === "creating-product") {
    return {
      state: {
        input: state.input,
        kind: "product-failed",
        reason: event.reason,
        retryable: event.retryable,
      },
    };
  }
  if (event.kind === "project-failed" && state.kind === "creating-project") {
    return { state: { ...state, kind: "project-failed", reason: event.reason } };
  }
  if (event.kind === "project-created" && state.kind === "creating-project") {
    return { state: { kind: "completed", productId: state.productId, projectId: event.projectId } };
  }
  if (event.kind === "retry" && state.kind === "product-failed" && state.retryable) {
    return {
      effect: { input: state.input, kind: "create-product" },
      state: { input: state.input, kind: "creating-product" },
    };
  }
  if (event.kind === "retry" && state.kind === "project-failed") {
    return {
      effect: { input: state.input, kind: "create-project", productId: state.productId },
      state: {
        input: state.input,
        kind: "creating-project",
        origin: state.origin,
        productId: state.productId,
      },
    };
  }
  if (event.kind === "cancel" && state.kind === "project-failed" && state.origin === "created") {
    return {
      effect: { kind: "delete-product", productId: state.productId },
      state: { input: state.input, kind: "cleaning-up", productId: state.productId },
    };
  }
  if (event.kind === "cancel" && state.kind === "project-failed") {
    return { state: { kind: "cancelled" } };
  }
  if (event.kind === "cleanup-succeeded" && state.kind === "cleaning-up") {
    return { state: { kind: "cancelled" } };
  }
  if (event.kind === "cleanup-failed" && state.kind === "cleaning-up") {
    return { state: { kind: "cleanup-failed", productId: state.productId, reason: event.reason } };
  }
  return { state };
};

export type EligibleProjectUnit = { organisationName: string; unit: UnitAllDetail };

/** Unit product creation follows the generated endpoint's unit-or-organisation membership rule. */
export const eligibleProjectCreationUnits = (
  groups: readonly OrganisationUnitsGetResponse[],
): EligibleProjectUnit[] =>
  groups.flatMap(({ organisation, units }) =>
    units
      .filter((unit) => unit.caller_is_member || organisation.caller_is_member)
      .map((unit) => ({ organisationName: organisation.name, unit })),
  );

export type HandoffValidation =
  | { kind: "invalid"; reason: string }
  | { kind: "valid"; subscription: ProductDmProjectTier };

/** A handoff is usable only while it is an unclaimed project-tier product in an eligible unit. */
export const validateProjectSubscriptionHandoff = (
  product: ProductDmProjectTier | ProductDmStorage,
  eligibleUnits: readonly EligibleProjectUnit[],
): HandoffValidation => {
  if (product.product.type !== ProductDetailType.DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION) {
    return { kind: "invalid", reason: "This subscription is not a project-tier subscription." };
  }
  const projectProduct = product as ProductDmProjectTier;
  if (!projectProduct.claimable || projectProduct.claim !== undefined) {
    return { kind: "invalid", reason: "This subscription is already linked to a project." };
  }
  if (!eligibleUnits.some(({ unit }) => unit.id === product.unit.id)) {
    return { kind: "invalid", reason: "You cannot create a project in this subscription's unit." };
  }
  return { kind: "valid", subscription: projectProduct };
};

export const PROJECT_CREATION_RECOVERY_KEY = "data-manager-ui-project-creation";

export type ProjectCreationRecovery = { input: ProjectCreationInput; productId: string };

const flavours = ["EVALUATION", "BRONZE", "SILVER", "GOLD"] as const;

/** Only a workflow record with generated identities and complete form state can authorize cleanup. */
export const parseProjectCreationRecovery = (
  value: unknown,
): ProjectCreationRecovery | undefined => {
  if (typeof value !== "object" || value === null || !("version" in value) || value.version !== 1) {
    return undefined;
  }
  const record = value as { input?: Partial<ProjectCreationInput>; productId?: unknown };
  const input = record.input;
  if (
    !input ||
    typeof input.name !== "string" ||
    !projectCreationNameIsValid(input.name) ||
    typeof input.isPrivate !== "boolean" ||
    typeof input.unitId !== "string" ||
    !isUnitId(input.unitId) ||
    typeof input.flavour !== "string" ||
    !flavours.includes(input.flavour) ||
    typeof record.productId !== "string" ||
    !isProductId(record.productId)
  ) {
    return undefined;
  }
  return { input: input as ProjectCreationInput, productId: record.productId };
};

export const readProjectCreationRecovery = (
  storage: Pick<Storage, "getItem">,
): ProjectCreationRecovery | undefined => {
  try {
    const value = storage.getItem(PROJECT_CREATION_RECOVERY_KEY);
    return value === null ? undefined : parseProjectCreationRecovery(JSON.parse(value));
  } catch {
    return undefined;
  }
};

export const rememberProjectCreation = (
  storage: Pick<Storage, "setItem">,
  recovery: ProjectCreationRecovery,
): boolean => {
  try {
    storage.setItem(PROJECT_CREATION_RECOVERY_KEY, JSON.stringify({ ...recovery, version: 1 }));
    return true;
  } catch {
    return false;
  }
};

export const forgetProjectCreation = (storage: Pick<Storage, "removeItem">) => {
  try {
    storage.removeItem(PROJECT_CREATION_RECOVERY_KEY);
  } catch {
    // Recovery storage is best effort after server work has already completed or been cleaned up.
  }
};

/** Recoverable failures keep the workflow facts and describe the service answer without changing scope. */
export const projectCreationFailureReason = (
  error: unknown,
  subject: "project" | "subscription",
) => {
  const failure = classifyTransportFailure(error);
  const label = subject === "project" ? "project" : "subscription";
  switch (failure.kind) {
    case "forbidden":
      return `The server did not allow this ${label} to be created. Review your access and retry.`;
    case "network":
      return `The ${label} request could not reach the service. Check your connection and retry.`;
    case "rate-limited":
      return `The ${label} service is busy. Wait briefly and retry.`;
    case "server":
      return `The ${label} service is unavailable. Retry when it has recovered.`;
    case "timeout":
      return `The ${label} request timed out. Its outcome could not be confirmed.`;
    default: {
      const data = isAxiosError<{ error?: string; message?: string }>(error)
        ? error.response?.data
        : undefined;
      return (
        data?.error ?? data?.message ?? `The ${label} could not be created. Correct it and retry.`
      );
    }
  }
};

/** A confirmed response means no product identity was hidden by a lost response; transport ambiguity does not. */
export const productCreationFailureIsRetryable = (error: unknown): boolean => {
  const failure = classifyTransportFailure(error);
  return (
    failure.kind === "forbidden" ||
    failure.kind === "not-found" ||
    failure.kind === "rate-limited" ||
    (failure.kind === "unknown" && failure.status !== undefined)
  );
};
