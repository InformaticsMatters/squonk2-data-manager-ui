import {
  type OrganisationAllDetail,
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetail,
} from "@/api/account-server";

import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateDatasetSubscriptionCreationCapability,
  evaluateProjectHandoffCapability,
  evaluateSubscriptionAdjustmentCapability,
  evaluateSubscriptionDeletionCapability,
  type SubscriptionCallerFacts,
} from "../../src/administration/subscriptionCapabilities";
import {
  describeSubscription,
  groupSubscriptionsByOwner,
  type Subscription,
  subscriptionKind,
} from "../../src/administration/subscriptionFacts";
import { isUnclaimedProjectSubscription } from "../../src/projects/projectCreation";

const organisationId = "org-00000000-0000-4000-8000-000000000001";
const otherOrganisationId = "org-00000000-0000-4000-8000-000000000002";
const unitId = "unit-00000000-0000-4000-8000-000000000003";
const otherUnitId = "unit-00000000-0000-4000-8000-000000000004";
const unlistedUnitId = "unit-00000000-0000-4000-8000-000000000005";
const productId = "product-00000000-0000-4000-8000-000000000006";
const storageProductId = "product-00000000-0000-4000-8000-000000000007";
const projectId = "project-00000000-0000-4000-8000-000000000008";

const owner = "owner@example.org";
const caller = { isPlatformAdministrator: false, username: "caller@example.org" };

const organisation = (id: string, name: string): OrganisationAllDetail => ({
  caller_is_member: false,
  created: "2026-01-02T03:04:05Z",
  default_product_privacy: "DEFAULT_PRIVATE",
  id,
  name,
  private: true,
  users: [],
});

const unit = (id: string, name: string): UnitAllDetail => ({
  billing_day: 1,
  caller_is_member: false,
  created: "2026-01-02T03:04:05Z",
  default_product_privacy: "DEFAULT_PRIVATE",
  id,
  name,
  owner_id: owner,
  private: true,
  users: [],
});

const coins = {
  allowance: 100,
  allowance_multiplier: 1,
  at_limit: false,
  billing_day: 4,
  billing_prediction: 0,
  billing_prediction_storage_contribution: 0,
  current_burn_rate: 0,
  limit: 200,
  overspend_multiplier: 1,
  remaining_days: 30,
  used: 25,
};

const storage = {
  coins: { unit_cost: 1, used: 0 },
  size: { current: "2 GB", peak: "2 GB", unit_size: "1 GB", units_used: 2 },
};

const projectTier = (
  overrides: Omit<Partial<ProductDmProjectTier>, "product"> & {
    product?: Partial<ProductDmProjectTier["product"]>;
  } = {},
): ProductDmProjectTier => ({
  claimable: true,
  coins,
  instance: { coins: { used: 3 } },
  organisation: organisation(organisationId, "Alpha Organisation"),
  storage,
  unit: unit(unitId, "Alpha Unit"),
  ...overrides,
  product: {
    created: "2026-01-02T03:04:05Z",
    flavour: "BRONZE",
    id: productId,
    type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
    ...overrides.product,
  },
});

const datasetStorage = (
  overrides: Omit<Partial<ProductDmStorage>, "product"> & {
    product?: Partial<ProductDmStorage["product"]>;
  } = {},
): ProductDmStorage => ({
  claimable: false,
  coins,
  organisation: organisation(organisationId, "Alpha Organisation"),
  storage,
  unit: unit(unitId, "Alpha Unit"),
  ...overrides,
  product: {
    created: "2026-01-02T03:04:05Z",
    id: storageProductId,
    name: "Dataset Storage",
    type: "DATA_MANAGER_STORAGE_SUBSCRIPTION",
    ...overrides.product,
  },
});

test.describe("subscription identity and facts", () => {
  test("each generated product type is presented as the subscription it is", () => {
    expect(subscriptionKind(projectTier())).toBe("project-tier");
    expect(subscriptionKind(datasetStorage())).toBe("dataset-storage");
    // A type a regenerated client added, which this application must list without acting on.
    const future: Subscription = datasetStorage();
    expect(
      subscriptionKind({
        ...future,
        product: { ...future.product, type: "FUTURE_SUBSCRIPTION" as never },
      }),
    ).toBe("unrecognised");
  });

  test("technical identity and billing facts come from the generated product alone", () => {
    const facts = describeSubscription(projectTier());

    expect(facts).toMatchObject({
      allowance: 100,
      atLimit: false,
      billingDay: 4,
      claimable: true,
      kind: "project-tier",
      limit: 200,
      organisation: { id: organisationId, name: "Alpha Organisation" },
      productId,
      storageSize: "2 GB",
      tier: "Bronze",
      type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      unit: { id: unitId, name: "Alpha Unit" },
      used: 25,
    });
  });

  test("an unnamed subscription and one with no flavour invent neither a name nor a tier", () => {
    const facts = describeSubscription(
      datasetStorage({ product: { flavour: undefined, name: undefined } }),
    );

    expect(facts.name).toBe("Subscription");
    expect(facts.tier).toBeUndefined();
  });

  test("a claim is addressable only when the identity it names is a project this client can route to", () => {
    const claimed = describeSubscription(
      projectTier({ claim: { id: projectId, name: "Alpha Project" } }),
    );
    expect(claimed.claim).toEqual({ name: "Alpha Project", projectId, serviceId: projectId });

    const foreign = describeSubscription(projectTier({ claim: { id: "not-a-project" } }));
    expect(foreign.claim).toEqual({
      name: undefined,
      projectId: undefined,
      serviceId: "not-a-project",
    });
  });

  test("whether a project may still claim a subscription is the Projects module's own answer", () => {
    // Administration presents the claim; Projects decides what is still claimable, so the two
    // cannot disagree about which subscription a handoff may use. The handoff capability asks that
    // one question and reports every unclaimable subscription the same way.
    const member: SubscriptionCallerFacts = {
      caller,
      isEvaluator: false,
      unit: { caller_is_member: true, owner_id: owner },
    };
    expect(isUnclaimedProjectSubscription(projectTier())).toBe(true);
    expect(evaluateProjectHandoffCapability({ ...member, product: projectTier() })).toEqual({
      status: "enabled",
    });

    for (const product of [
      projectTier({ claim: { id: projectId } }),
      projectTier({ claimable: false }),
      datasetStorage(),
    ]) {
      expect(isUnclaimedProjectSubscription(product)).toBe(false);
      expect(evaluateProjectHandoffCapability({ ...member, product })).toEqual({
        status: "disabled",
        reason: "No project can claim this subscription.",
      });
    }
  });
});

test.describe("subscription grouping", () => {
  const alpha = organisation(organisationId, "Alpha Organisation");
  const beta = organisation(otherOrganisationId, "Beta Organisation");
  const alphaUnit = unit(unitId, "Alpha Unit");
  const secondAlphaUnit = unit(otherUnitId, "Second Unit");

  test("every readable unit can hold a subscription before it has one", () => {
    const groups = groupSubscriptionsByOwner({
      organisations: [alpha],
      products: [],
      units: [{ organisation: alpha, unit: alphaUnit }],
    });

    expect(groups).toEqual([
      { organisation: alpha, units: [{ subscriptions: [], unit: alphaUnit }] },
    ]);
  });

  test("each owner carries the membership facts its subscription actions answer to", () => {
    const memberUnit = { ...alphaUnit, caller_is_member: true };
    const groups = groupSubscriptionsByOwner({
      organisations: [{ ...alpha, caller_is_member: true }],
      products: [],
      units: [{ organisation: alpha, unit: memberUnit }],
    });

    expect(groups[0].organisation.caller_is_member).toBe(true);
    expect(groups[0].units[0].unit).toMatchObject({ caller_is_member: true, owner_id: owner });
  });

  test("an organisation with no readable unit remains a readable group", () => {
    const groups = groupSubscriptionsByOwner({
      organisations: [alpha, beta],
      products: [],
      units: [{ organisation: alpha, unit: alphaUnit }],
    });

    expect(groups.map(({ organisation: group }) => group.name)).toEqual([
      "Alpha Organisation",
      "Beta Organisation",
    ]);
    expect(groups[1].units).toEqual([]);
  });

  test("a subscription in a unit the caller's index never lists keeps the ancestry it declares", () => {
    const unlisted = datasetStorage({
      organisation: beta,
      product: { id: storageProductId, name: "Unlisted Storage" },
      unit: unit(unlistedUnitId, "Unlisted Unit"),
    });

    const groups = groupSubscriptionsByOwner({
      organisations: [alpha],
      products: [unlisted],
      units: [{ organisation: alpha, unit: alphaUnit }],
    });

    expect(groups.map(({ organisation: group }) => group.name)).toEqual([
      "Alpha Organisation",
      "Beta Organisation",
    ]);
    expect(groups[1].units[0]).toMatchObject({
      subscriptions: [{ name: "Unlisted Storage", productId: storageProductId }],
      unit: { id: unlistedUnitId, name: "Unlisted Unit" },
    });
  });

  test("organisations, units, and subscriptions are ordered so a group can be found by name", () => {
    const groups = groupSubscriptionsByOwner({
      organisations: [beta, alpha],
      products: [
        datasetStorage({ product: { id: storageProductId, name: "Zulu Storage" } }),
        projectTier({ product: { id: productId, name: "Alpha Tier" } }),
        datasetStorage({
          product: { id: "product-00000000-0000-4000-8000-000000000009", name: "Second Storage" },
          unit: secondAlphaUnit,
        }),
      ],
      units: [
        { organisation: alpha, unit: secondAlphaUnit },
        { organisation: alpha, unit: alphaUnit },
      ],
    });

    expect(groups.map(({ organisation: group }) => group.name)).toEqual([
      "Alpha Organisation",
      "Beta Organisation",
    ]);
    expect(groups[0].units.map(({ unit: group }) => group.name)).toEqual([
      "Alpha Unit",
      "Second Unit",
    ]);
    expect(groups[0].units[0].subscriptions.map(({ name }) => name)).toEqual([
      "Alpha Tier",
      "Zulu Storage",
    ]);
  });
});

test.describe("subscription capabilities", () => {
  const member: SubscriptionCallerFacts = {
    caller,
    isEvaluator: false,
    unit: { caller_is_member: true, owner_id: owner },
  };
  const stranger: SubscriptionCallerFacts = {
    caller,
    isEvaluator: false,
    unit: { caller_is_member: false, owner_id: owner },
  };

  test("the unit's own members, its organisation's members, its owner, and the platform may act", () => {
    expect(evaluateDatasetSubscriptionCreationCapability(member)).toEqual({ status: "enabled" });
    expect(
      evaluateDatasetSubscriptionCreationCapability({
        ...stranger,
        organisation: { caller_is_member: true },
      }),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateDatasetSubscriptionCreationCapability({
        ...stranger,
        unit: { caller_is_member: false, owner_id: caller.username },
      }),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateDatasetSubscriptionCreationCapability({
        ...stranger,
        caller: { ...caller, isPlatformAdministrator: true },
      }),
    ).toEqual({ status: "enabled" });
  });

  test("a caller with no relationship to the unit is refused with the relationship it needs", () => {
    for (const capability of [
      evaluateDatasetSubscriptionCreationCapability(stranger),
      evaluateSubscriptionAdjustmentCapability({ ...stranger, kind: "dataset-storage" }),
      evaluateSubscriptionDeletionCapability({ ...stranger, claimed: false }),
      evaluateProjectHandoffCapability({ ...stranger, product: projectTier() }),
    ]) {
      expect(capability.status).toBe("disabled");
      expect(capability.status === "disabled" && capability.reason).toContain(
        "member of this unit or its organisation",
      );
    }
  });

  test("no subscription action is ever hidden, because none belongs to the platform alone", () => {
    const evaluated = [
      evaluateDatasetSubscriptionCreationCapability(stranger),
      evaluateSubscriptionAdjustmentCapability({ ...stranger, kind: "project-tier" }),
      evaluateSubscriptionAdjustmentCapability({ ...stranger, kind: "unrecognised" }),
      evaluateSubscriptionDeletionCapability({ ...stranger, claimed: true }),
      evaluateProjectHandoffCapability({
        ...member,
        isEvaluator: true,
        isPersonalUnit: false,
        product: projectTier(),
      }),
    ];

    expect(evaluated.map(({ status }) => status)).not.toContain("hidden");
  });

  test("facts that have not been established keep an ordinary action available and say so", () => {
    const stale = { ...member, freshness: "stale" as const };
    const unknownCaller = { ...member, caller: { isPlatformAdministrator: false } };

    for (const facts of [stale, unknownCaller]) {
      expect(evaluateDatasetSubscriptionCreationCapability(facts)).toEqual({
        status: "enabled",
        reason: "Your permission will be confirmed when you use this action.",
      });
      expect(
        evaluateSubscriptionAdjustmentCapability({ ...facts, kind: "dataset-storage" }),
      ).toEqual({
        status: "enabled",
        reason: "Your permission will be confirmed when you use this action.",
      });
      expect(evaluateProjectHandoffCapability({ ...facts, product: projectTier() })).toEqual({
        status: "enabled",
        reason: "Your permission will be confirmed when you use this action.",
      });
    }
  });

  test("an evaluation account is told nothing about its own unit until that unit is known", () => {
    const evaluator = { ...member, isEvaluator: true };

    expect(evaluateDatasetSubscriptionCreationCapability(evaluator)).toEqual({
      status: "enabled",
      reason: "Your permission will be confirmed when you use this action.",
    });
    expect(
      evaluateDatasetSubscriptionCreationCapability({ ...evaluator, isPersonalUnit: false }),
    ).toEqual({
      status: "disabled",
      reason: "Evaluation accounts can only subscribe their own personal unit.",
    });
    expect(
      evaluateDatasetSubscriptionCreationCapability({ ...evaluator, isPersonalUnit: true }),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateProjectHandoffCapability({
        ...evaluator,
        isPersonalUnit: false,
        product: projectTier(),
      }),
    ).toEqual({
      status: "disabled",
      reason: "Evaluation accounts can only create projects in their own personal unit.",
    });
  });

  test("a subscription this client does not recognise is readable and adjusts nothing", () => {
    expect(evaluateSubscriptionAdjustmentCapability({ ...member, kind: "unrecognised" })).toEqual({
      status: "disabled",
      reason: "This subscription's type is not one this application can adjust.",
    });
  });

  test("a claimed subscription names the deletion that has to happen first", () => {
    expect(evaluateSubscriptionDeletionCapability({ ...member, claimed: true })).toEqual({
      status: "disabled",
      reason: "Delete the project using this subscription before deleting the subscription.",
    });
    expect(evaluateSubscriptionDeletionCapability({ ...member, claimed: false })).toEqual({
      status: "enabled",
    });
    // The refusal is a fact of the subscription, so it holds even before the caller is established.
    expect(
      evaluateSubscriptionDeletionCapability({ ...member, claimed: true, freshness: "stale" }),
    ).toEqual({
      status: "disabled",
      reason: "Delete the project using this subscription before deleting the subscription.",
    });
  });
});

test.describe("subscription ownership and cutover", () => {
  const root = path.join(process.cwd(), "src");
  const typescriptSource = /\.tsx?$/u;
  const generated = /(^|\/)generated(\/|$)/u;

  const handwrittenSources = () =>
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      )
      .filter((file) => !generated.test(file) && !file.startsWith("api/"))
      .toSorted();

  test("one Administration module holds every subscription mutation the task makes", () => {
    // Projects creates and cleans up the subscription its own creation workflow owns; within
    // Administration there is exactly one place a subscription is created, adjusted, or deleted.
    const productMutations = /use(CreateUnitProduct|DeleteProduct|PatchProduct)\b/u;
    const owners = handwrittenSources().filter(
      (file) =>
        file.startsWith("administration/") &&
        productMutations.test(readFileSync(path.join(root, file), "utf8")),
    );

    expect(owners).toEqual(["administration/useSubscriptionCommands.ts"]);
  });

  test("that module invalidates the generated product and unit identities it changed", () => {
    const owner = readFileSync(
      path.join(root, "administration/useSubscriptionCommands.ts"),
      "utf8",
    );

    for (const key of [
      "getGetProductsQueryKey()",
      "getGetProductQueryKey(",
      "getGetProductsForUnitQueryKey(",
      "getGetProductsForOrganisationQueryKey(",
    ]) {
      expect(owner).toContain(key);
    }
  });

  test("no screen outside the commands module holds a product query client", () => {
    const screens = ["administration/Subscriptions.tsx"];
    for (const screen of screens) {
      const source = readFileSync(path.join(root, screen), "utf8");
      expect(source).not.toMatch(/useQueryClient|invalidateQueries/u);
    }
  });

  test("Administration hands project creation over rather than duplicating it", () => {
    const source = readFileSync(path.join(root, "administration/Subscriptions.tsx"), "utf8");

    expect(source).toContain("projectLinks.create");
    // Creating or managing the project itself belongs to Projects, not to this task.
    expect(source).not.toMatch(/useCreateProject|useDeleteProject|usePatchProject/u);
  });

  test("the legacy Products screens are gone rather than merely unreachable", () => {
    const legacyProductScreens = new RegExp(
      [
        "ProductsView",
        "ProductTables",
        String.raw`components/products/(AdjustProjectProduct|DeleteProductButton)`,
        "CreateDatasetStorageSubscription",
        // The orphaned project-stats section that held a second subscription-deletion control.
        "ProjectStats/ProjectStatsSection",
        "ProjectStats/useStorageSubscriptions",
        "pages/products",
      ].join("|"),
      "u",
    );
    const removed = handwrittenSources().filter((file) => legacyProductScreens.test(file));

    expect(removed).toEqual([]);
  });
});
