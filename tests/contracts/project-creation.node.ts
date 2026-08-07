import {
  type OrganisationUnitsGetResponse,
  type ProductDmProjectTier,
  type ProductType,
  type UnitAllDetail,
} from "@/api/account-server";

import { expect, test } from "@playwright/test";

import {
  eligibleProjectCreationFlavours,
  eligibleProjectCreationUnits,
  type EligibleProjectUnit,
  forgetProjectCreation,
  initialProjectCreationState,
  isUnclaimedProjectSubscription,
  parseProjectCreationRecovery,
  productCreationFailureIsRetryable,
  projectCreationFailureReason,
  type ProjectCreationInput,
  readProjectCreationRecovery,
  reconcileProjectCreationRecovery,
  rememberProjectCreation,
  transitionProjectCreation,
  validateProjectSubscriptionHandoff,
} from "../../src/projects/projectCreation";

const productId = "product-00000000-0000-4000-8000-000000000002";
const projectId = "project-00000000-0000-4000-8000-000000000001";
const input: ProjectCreationInput = {
  flavour: "BRONZE",
  isPrivate: true,
  name: "Recoverable screen",
  unitId: "unit-00000000-0000-4000-8000-000000000003",
};

test.describe("Project creation lifecycle", () => {
  test("reuses a created subscription after project failure and cleans it up on cancellation", () => {
    const creatingProduct = transitionProjectCreation(initialProjectCreationState, {
      input,
      kind: "submit",
    });
    expect(creatingProduct).toEqual({
      effect: { input, kind: "create-product" },
      state: { input, kind: "creating-product" },
    });

    const creatingProject = transitionProjectCreation(creatingProduct.state, {
      kind: "product-created",
      productId,
    });
    expect(creatingProject).toEqual({
      effect: { input, kind: "create-project", productId },
      state: { input, kind: "creating-project", origin: "created", productId },
    });

    const failed = transitionProjectCreation(creatingProject.state, {
      kind: "project-failed",
      reason: "The Data Manager is unavailable.",
    });
    expect(failed.state).toEqual({
      input,
      kind: "project-failed",
      origin: "created",
      productId,
      reason: "The Data Manager is unavailable.",
    });
    expect(transitionProjectCreation(failed.state, { kind: "retry" })).toEqual({
      effect: { input, kind: "create-project", productId },
      state: { input, kind: "creating-project", origin: "created", productId },
    });
    expect(transitionProjectCreation(failed.state, { kind: "cancel" })).toEqual({
      effect: { kind: "delete-product", productId },
      state: { input, kind: "cleaning-up", productId },
    });
  });

  test("completes only after the Data Manager returns a project identity", () => {
    const creating = transitionProjectCreation(initialProjectCreationState, {
      input,
      kind: "submit",
      subscription: { origin: "handoff", productId },
    });
    expect(creating.effect).toEqual({ input, kind: "create-project", productId });
    expect(
      transitionProjectCreation(creating.state, { kind: "project-created", projectId }),
    ).toEqual({ state: { kind: "completed", productId, projectId } });
  });

  test("retains the subscription identity when cancellation cleanup fails", () => {
    const cleaning = transitionProjectCreation(
      { input, kind: "project-failed", origin: "created", productId, reason: "Project failed." },
      { kind: "cancel" },
    );
    expect(
      transitionProjectCreation(cleaning.state, {
        kind: "cleanup-failed",
        reason: "Cleanup failed.",
      }),
    ).toEqual({ state: { kind: "cleanup-failed", productId, reason: "Cleanup failed." } });
  });

  test("does not retry an ambiguous product request", () => {
    const failed = transitionProjectCreation(
      { input, kind: "creating-product" },
      { kind: "product-failed", reason: "The request timed out.", retryable: false },
    );
    expect(failed.state).toEqual({
      input,
      kind: "product-failed",
      reason: "The request timed out.",
      retryable: false,
    });
    expect(transitionProjectCreation(failed.state, { kind: "retry" })).toEqual(failed);
    // Cancelling abandons the attempt without cleanup, so an unconfirmed request cannot wedge the
    // workflow into a state that offers neither a retry nor a new attempt.
    expect(transitionProjectCreation(failed.state, { kind: "cancel" })).toEqual({
      state: { kind: "cancelled" },
    });
  });

  test("retries a product request after a confirmed rejection", () => {
    const failed = transitionProjectCreation(
      { input, kind: "creating-product" },
      { kind: "product-failed", reason: "Rate limited.", retryable: true },
    );
    expect(transitionProjectCreation(failed.state, { kind: "retry" })).toEqual({
      effect: { input, kind: "create-product" },
      state: { input, kind: "creating-product" },
    });
    expect(transitionProjectCreation(failed.state, { kind: "cancel" })).toEqual({
      state: { kind: "cancelled" },
    });
  });

  test("cleans up a created product but never a handed-off product", () => {
    const handedOff = {
      input,
      kind: "project-failed" as const,
      origin: "handoff" as const,
      productId,
      reason: "Project failed.",
    };
    expect(transitionProjectCreation(handedOff, { kind: "cancel" })).toEqual({
      state: { kind: "cancelled" },
    });
    expect(
      transitionProjectCreation(
        { input, kind: "cleaning-up", productId },
        { kind: "cleanup-succeeded" },
      ),
    ).toEqual({ state: { kind: "cancelled" } });
  });
});

test("product retry safety distinguishes confirmed responses from ambiguous transport", () => {
  const axiosFailure = (status?: number, code?: string) => ({
    code,
    isAxiosError: true,
    response: status === undefined ? undefined : { data: {}, status },
  });
  expect(productCreationFailureIsRetryable(axiosFailure(403))).toBe(true);
  expect(productCreationFailureIsRetryable(axiosFailure(429))).toBe(true);
  expect(productCreationFailureIsRetryable(axiosFailure(500))).toBe(false);
  expect(productCreationFailureIsRetryable(axiosFailure(undefined, "ETIMEDOUT"))).toBe(false);
  expect(productCreationFailureIsRetryable(axiosFailure())).toBe(false);
  expect(productCreationFailureIsRetryable(axiosFailure(undefined, "ERR_NETWORK"))).toBe(false);
  expect(
    projectCreationFailureReason(axiosFailure(undefined, "ETIMEDOUT"), "subscription"),
  ).toContain("timed out");
  expect(projectCreationFailureReason(axiosFailure(403), "subscription")).toContain(
    "did not allow this subscription",
  );
  expect(projectCreationFailureReason(axiosFailure(undefined, "ERR_NETWORK"), "project")).toContain(
    "could not reach the service",
  );
  expect(projectCreationFailureReason(axiosFailure(429), "project")).toContain("service is busy");
  expect(projectCreationFailureReason(axiosFailure(503), "project")).toContain(
    "service is unavailable",
  );
  expect(
    projectCreationFailureReason(
      { isAxiosError: true, response: { data: { error: "fixture-domain-failure" }, status: 400 } },
      "project",
    ),
  ).toBe("fixture-domain-failure");
});

test.describe("Project creation eligibility", () => {
  const personalUnit = {
    caller_is_member: true,
    id: "unit-00000000-0000-4000-8000-000000000004",
  } as UnitAllDetail;
  const memberUnit = { caller_is_member: true, id: input.unitId } as UnitAllDetail;
  const groups = [
    {
      organisation: { caller_is_member: true, name: "Research" },
      units: [memberUnit, personalUnit],
    },
  ] as OrganisationUnitsGetResponse[];
  const productTypes = ["EVALUATION", "BRONZE", "SILVER"].map((flavour) => ({
    flavour,
    type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
  })) as ProductType[];

  test("restricts an evaluator to their generated personal unit and evaluation tier", () => {
    expect(
      eligibleProjectCreationUnits(groups, {
        evaluatorPersonalUnitId: personalUnit.id,
        isEvaluator: true,
      }).map(({ unit }) => unit.id),
    ).toEqual([personalUnit.id]);
    expect(eligibleProjectCreationFlavours(productTypes, true)).toEqual(["EVALUATION"]);
  });

  test("retains generated member units and project tiers for an ordinary user", () => {
    expect(
      eligibleProjectCreationUnits(groups, { isEvaluator: false }).map(({ unit }) => unit.id),
    ).toEqual([memberUnit.id, personalUnit.id]);
    expect(eligibleProjectCreationFlavours(productTypes, false)).toEqual([
      "EVALUATION",
      "BRONZE",
      "SILVER",
    ]);
  });
});

test("project creation recovery preserves each recoverable request phase and can be cleared", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const recoveries = [
    { input, kind: "product-requested" },
    { input, kind: "product-failed", reason: "The subscription service is busy.", retryable: true },
    { input, kind: "project-requested", origin: "created", productId },
  ] as const;

  for (const recovery of recoveries) {
    rememberProjectCreation(storage, recovery);
    expect(readProjectCreationRecovery(storage)).toEqual(recovery);
  }
  forgetProjectCreation(storage);
  expect(readProjectCreationRecovery(storage)).toBeUndefined();
  expect(
    parseProjectCreationRecovery({
      input,
      kind: "project-requested",
      origin: "created",
      productId: "not-a-product",
      version: 2,
    }),
  ).toBeUndefined();
  expect(
    parseProjectCreationRecovery({
      input: { ...input, name: "x" },
      kind: "product-requested",
      version: 2,
    }),
  ).toBeUndefined();
});

test.describe("Project subscription handoff", () => {
  const unit = { id: input.unitId } as UnitAllDetail;
  const eligibleUnits: EligibleProjectUnit[] = [{ organisationName: "Research", unit }];
  const subscription = {
    claimable: true,
    product: {
      flavour: input.flavour,
      id: productId,
      type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
    },
    unit,
  } as ProductDmProjectTier;

  test("accepts an eligible unclaimed project-tier subscription", () => {
    expect(isUnclaimedProjectSubscription(subscription)).toBe(true);
    expect(validateProjectSubscriptionHandoff(subscription, eligibleUnits)).toEqual({
      kind: "valid",
      subscription,
    });
  });

  test("reconciles a committed project response from the subscription claim", () => {
    expect(
      reconcileProjectCreationRecovery(
        { input, kind: "project-requested", origin: "created", productId },
        { ...subscription, claim: { id: projectId } },
      ),
    ).toEqual({ kind: "completed", projectId });
  });

  test("resumes a matching unclaimed subscription without creating another product", () => {
    const recovery = {
      input,
      kind: "project-requested" as const,
      origin: "created" as const,
      productId,
    };
    expect(reconcileProjectCreationRecovery(recovery, subscription)).toEqual({
      kind: "resume",
      recovery,
      subscription,
    });
  });

  for (const [name, candidate, reason] of [
    [
      "claimed subscription",
      { ...subscription, claim: { id: projectId } },
      "This subscription is already linked to a project.",
    ],
    [
      "wrong product type",
      {
        ...subscription,
        product: { ...subscription.product, type: "DATA_MANAGER_STORAGE_SUBSCRIPTION" },
      },
      "This subscription is not a project-tier subscription.",
    ],
  ] as const) {
    test(`rejects a ${name}`, () => {
      expect(
        validateProjectSubscriptionHandoff(candidate as ProductDmProjectTier, eligibleUnits),
      ).toEqual({ kind: "invalid", reason });
    });
  }

  test("rejects a subscription outside the caller's eligible units", () => {
    expect(validateProjectSubscriptionHandoff(subscription, [])).toEqual({
      kind: "invalid",
      reason: "You cannot create a project in this subscription's unit.",
    });
  });
});
