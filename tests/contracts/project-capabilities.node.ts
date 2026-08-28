import { type ProductDmProjectTier, type ProductDmStorage } from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { expect, test } from "@playwright/test";

import {
  capabilityReason,
  evaluateProjectAdministratorsCapability,
  evaluateProjectDatasetCreationCapability,
  evaluateProjectDeletionCapability,
  evaluateProjectEditorsCapability,
  evaluateProjectExecutionCapability,
  evaluateProjectFileMutationCapability,
  evaluateProjectObserversCapability,
  evaluateProjectPrivacyCapability,
  evaluateResultRerunCapability,
  type ProjectCapability,
  type ProjectCapabilityFacts,
  projectIsReadOnly,
  resolveProjectRoles,
} from "../../src/projects/capabilities";
import { describeProjectSubscription } from "../../src/projects/projectSubscription";

const administrator = "administrator@example.org";
const editor = "editor@example.org";
const observer = "observer@example.org";
const creator = "creator@example.org";
const stranger = "stranger@example.org";
const productId = "product-77777777-7777-4777-8777-777777777777";

const project = (overrides: Partial<ProjectDetail> = {}) =>
  ({
    administrators: [administrator],
    creator,
    editors: [editor],
    observers: [observer],
    ...overrides,
  }) as ProjectCapabilityFacts["project"];

type FactOptions = Partial<ProjectDetail> & {
  accountsForInstances?: boolean;
  atLimit?: boolean;
  freshness?: "current" | "stale";
  /** Passing this as `false` is a project whose linked subscription could not be read at all. */
  hasSubscription?: boolean;
  /** Passing this explicitly as `undefined` is the point of several cases, so it never defaults. */
  username?: string;
};

const facts = (options: FactOptions = {}): ProjectCapabilityFacts => {
  const {
    accountsForInstances = true,
    atLimit = false,
    freshness,
    hasSubscription = true,
    username,
    ...projectOverrides
  } = options;
  const caller = { username: "username" in options ? username : administrator };

  return {
    caller,
    project: project(projectOverrides),
    ...(hasSubscription ? { subscription: { accountsForInstances, atLimit } } : {}),
    ...(freshness ? { freshness } : {}),
  };
};

/** An unconfirmed capability stays available, but still states what the action requires. */
const unconfirmed = (requirement: string) => ({
  reason: `${requirement} Your permission will be confirmed when you use this action.`,
  status: "enabled",
});

const unreadableSubscriptionReasons = {
  execution:
    "This project's subscription is unavailable, so running work cannot be established as safe.",
  files:
    "This project's subscription is unavailable, so changing files cannot be established as safe.",
};

const unknownUnitReason =
  "This project's containing unit could not be established, so a dataset cannot be created from this file.";

const unaccountableExecutionReason =
  "This project's subscription does not account for instances, so running work cannot be established as safe.";

const enabled = { status: "enabled" };

const disabled = (reason: string) => ({ reason, status: "disabled" });

/** Every ordinary project action, so one matrix can assert the family's whole retained surface. */
const administratorActions = [
  {
    evaluate: evaluateProjectPrivacyCapability,
    requirement: "You must be a project administrator to change project privacy.",
  },
  {
    evaluate: evaluateProjectAdministratorsCapability,
    requirement: "You must be a project administrator to change project administrators.",
  },
  {
    evaluate: evaluateProjectEditorsCapability,
    requirement: "You must be a project administrator to change project editors.",
  },
  {
    evaluate: evaluateProjectObserversCapability,
    requirement: "You must be a project administrator to change project observers.",
  },
  {
    evaluate: evaluateProjectDeletionCapability,
    requirement: "You must be a project administrator to delete this project.",
  },
] as const;

const editorActions = [
  {
    evaluate: evaluateProjectFileMutationCapability,
    limitReason: "This project's subscription is at its coin limit, so files cannot be changed.",
    requirement: "You must be a project editor or administrator to change project files.",
    unreadableReason: unreadableSubscriptionReasons.files,
  },
  {
    evaluate: evaluateProjectExecutionCapability,
    limitReason: "This project's subscription is at its coin limit, so work cannot be run.",
    requirement: "You must be a project editor or administrator to run work in this project.",
    unreadableReason: unreadableSubscriptionReasons.execution,
  },
] as const;

const everyOrdinaryAction = [...administratorActions, ...editorActions];

test.describe("Project membership semantics", () => {
  test("roles come from the generated project resource and the caller's username alone", () => {
    expect(resolveProjectRoles(project(), administrator)).toEqual({
      isAdministrator: true,
      isCreator: false,
      isEditor: false,
      isObserver: false,
    });
    expect(resolveProjectRoles(project(), creator)).toEqual({
      isAdministrator: false,
      isCreator: true,
      isEditor: false,
      isObserver: false,
    });
    expect(resolveProjectRoles(project(), editor)).toEqual({
      isAdministrator: false,
      isCreator: false,
      isEditor: true,
      isObserver: false,
    });
    expect(resolveProjectRoles(project(), observer)).toEqual({
      isAdministrator: false,
      isCreator: false,
      isEditor: false,
      isObserver: true,
    });
    expect(resolveProjectRoles(project(), stranger)).toEqual({
      isAdministrator: false,
      isCreator: false,
      isEditor: false,
      isObserver: false,
    });
    // An unknown caller never matches a membership, however the lists are shaped.
    expect(resolveProjectRoles(project({ administrators: [] }), undefined)).toEqual({
      isAdministrator: false,
      isCreator: false,
      isEditor: false,
      isObserver: false,
    });
  });

  test("a caller can hold several concrete project roles at once", () => {
    expect(
      resolveProjectRoles(
        project({ administrators: [creator], creator, editors: [creator], observers: [creator] }),
        creator,
      ),
    ).toEqual({ isAdministrator: true, isCreator: true, isEditor: true, isObserver: true });
  });
});

test.describe("Ordinary project capabilities", () => {
  test("administrator actions are enabled only for project administrators", () => {
    for (const { evaluate, requirement: reason } of administratorActions) {
      expect(evaluate(facts({ username: administrator }))).toEqual(enabled);
      expect(evaluate(facts({ username: creator }))).toEqual(disabled(reason));
      expect(evaluate(facts({ username: editor }))).toEqual(disabled(reason));
      expect(evaluate(facts({ username: observer }))).toEqual(disabled(reason));
      expect(evaluate(facts({ username: stranger }))).toEqual(disabled(reason));
    }
  });

  test("editor actions are enabled for project editors and administrators", () => {
    for (const { evaluate, requirement } of editorActions) {
      expect(evaluate(facts({ username: administrator }))).toEqual(enabled);
      expect(evaluate(facts({ username: editor }))).toEqual(enabled);
      expect(evaluate(facts({ username: observer }))).toEqual(disabled(requirement));
      expect(evaluate(facts({ username: creator }))).toEqual(disabled(requirement));
      expect(evaluate(facts({ username: stranger }))).toEqual(disabled(requirement));
    }
  });

  test("a readable but non-mutable project disables every ordinary action with a reason", () => {
    for (const { evaluate } of everyOrdinaryAction) {
      const capability = evaluate(facts({ username: observer }));
      expect(capability.status).toBe("disabled");
      expect(capabilityReason(capability)).toBeTruthy();
    }
  });

  test("an authorised caller is stopped by a subscription at its coin limit", () => {
    for (const { evaluate, limitReason } of editorActions) {
      expect(evaluate(facts({ atLimit: true, username: administrator }))).toEqual(
        disabled(limitReason),
      );
      expect(evaluate(facts({ atLimit: true, username: editor }))).toEqual(disabled(limitReason));
      // Lacking authority is the more useful explanation, so it is reported first.
      expect(capabilityReason(evaluate(facts({ atLimit: true, username: observer })))).not.toBe(
        limitReason,
      );
    }
    // A coin limit constrains spending, never project administration.
    for (const { evaluate } of administratorActions) {
      expect(evaluate(facts({ atLimit: true, username: administrator }))).toEqual(enabled);
    }
  });
});

test.describe("Read-only project access", () => {
  test("read-only means no mutation authority, not merely a blocked action", () => {
    expect(projectIsReadOnly(facts({ username: observer }))).toBe(true);
    expect(projectIsReadOnly(facts({ username: stranger }))).toBe(true);
    // The creator holds no mutation authority of its own under the generated contract.
    expect(projectIsReadOnly(facts({ username: creator }))).toBe(true);
    expect(projectIsReadOnly(facts({ username: administrator }))).toBe(false);
    expect(projectIsReadOnly(facts({ username: editor }))).toBe(false);
    // An editor stopped only by the coin limit still has authority over the project.
    expect(projectIsReadOnly(facts({ atLimit: true, username: editor }))).toBe(false);
    expect(
      everyOrdinaryAction.every(
        ({ evaluate }) =>
          evaluate(facts({ atLimit: true, username: editor })).status === "disabled",
      ),
    ).toBe(true);
  });

  test("unconfirmed facts never claim read-only access", () => {
    expect(projectIsReadOnly(facts({ freshness: "stale", username: observer }))).toBe(false);
    expect(projectIsReadOnly(facts({ username: undefined }))).toBe(false);
  });
});

test.describe("Incomplete and stale project facts", () => {
  test("ordinary actions stay available with requirement text while facts are stale", () => {
    for (const { evaluate, requirement } of everyOrdinaryAction) {
      const expected = unconfirmed(requirement);
      expect(evaluate(facts({ freshness: "stale", username: observer }))).toEqual(expected);
      expect(evaluate(facts({ freshness: "stale", username: administrator }))).toEqual(expected);
      expect(evaluate(facts({ username: undefined }))).toEqual(expected);
      // Requirement text names the authority the action needs, not merely that it will be checked.
      expect(capabilityReason(evaluate(facts({ username: undefined })))).toContain(requirement);
    }
  });

  test("spending stays disabled with an explicit reason when safety cannot be established", () => {
    // Only a project-tier subscription accounts for instances, so work run against any other
    // linked subscription could not be charged for, whatever authority the caller holds.
    const unaccountable = (options: FactOptions) =>
      evaluateProjectExecutionCapability(facts({ accountsForInstances: false, ...options }));
    expect(unaccountable({ username: administrator })).toEqual(
      disabled(unaccountableExecutionReason),
    );
    expect(unaccountable({ username: editor })).toEqual(disabled(unaccountableExecutionReason));
    // It outranks the optimistic stale fallback, so incomplete facts still explain the safety.
    expect(unaccountable({ freshness: "stale", username: administrator })).toEqual(
      disabled(unaccountableExecutionReason),
    );
    expect(unaccountable({ username: undefined })).toEqual(disabled(unaccountableExecutionReason));
    // A confirmed lack of authority stays the more useful explanation, exactly as at the coin limit.
    expect(unaccountable({ username: observer })).toEqual(
      disabled("You must be a project editor or administrator to run work in this project."),
    );

    // Every linked subscription accounts for storage, and administration never spends coins.
    expect(
      evaluateProjectFileMutationCapability(
        facts({ accountsForInstances: false, username: administrator }),
      ),
    ).toEqual(enabled);
    for (const { evaluate } of administratorActions) {
      expect(evaluate(facts({ accountsForInstances: false, username: administrator }))).toEqual(
        enabled,
      );
    }
  });
});

/** One result of the project in the URL, so a result action reads nothing about another project. */
const ownResultFacts = (options: FactOptions) => ({
  ...facts(options),
  owningProjectId: "project-one",
  routeProjectId: "project-one",
});

/** One file action of the project, told which unit a dataset made from that file would go to. */
const datasetFacts = ({ unitId, ...options }: FactOptions & { unitId?: string }) => ({
  ...facts(options),
  ...(unitId === undefined ? {} : { unitId }),
});

test.describe("A project whose linked subscription could not be read", () => {
  test("withholds every spend with the same reason, whatever authority the caller holds", () => {
    for (const { evaluate, unreadableReason } of editorActions) {
      expect(evaluate(facts({ hasSubscription: false, username: administrator }))).toEqual(
        disabled(unreadableReason),
      );
      expect(evaluate(facts({ hasSubscription: false, username: editor }))).toEqual(
        disabled(unreadableReason),
      );
      // A missing subscription is a fact of its own, so it outranks the optimistic stale fallback.
      expect(
        evaluate(facts({ freshness: "stale", hasSubscription: false, username: administrator })),
      ).toEqual(disabled(unreadableReason));
      expect(evaluate(facts({ hasSubscription: false, username: undefined }))).toEqual(
        disabled(unreadableReason),
      );
      // A confirmed lack of authority stays the more useful explanation, as at the coin limit.
      expect(
        capabilityReason(evaluate(facts({ hasSubscription: false, username: observer }))),
      ).toBe(capabilityReason(evaluate(facts({ username: observer }))));
    }
  });

  test("leaves every ordinary administration of the project itself available", () => {
    for (const { evaluate } of administratorActions) {
      expect(evaluate(facts({ hasSubscription: false, username: administrator }))).toEqual(enabled);
    }
    expect(projectIsReadOnly(facts({ hasSubscription: false, username: administrator }))).toBe(
      false,
    );
    expect(projectIsReadOnly(facts({ hasSubscription: false, username: observer }))).toBe(true);
  });

  test("keeps rerunning one of its results withheld for the same reason", () => {
    expect(evaluateResultRerunCapability(ownResultFacts({ hasSubscription: false }))).toEqual(
      disabled(unreadableSubscriptionReasons.execution),
    );
  });
});

test.describe("Creating a dataset from a project file", () => {
  test("is offered exactly as a file change is, for a project that names its unit", () => {
    expect(
      evaluateProjectDatasetCreationCapability(
        datasetFacts({ unitId: "unit-one", username: administrator }),
      ),
    ).toEqual(enabled);
    expect(
      evaluateProjectDatasetCreationCapability(
        datasetFacts({ unitId: "unit-one", username: observer }),
      ),
    ).toEqual(disabled("You must be a project editor or administrator to change project files."));
    expect(
      evaluateProjectDatasetCreationCapability(
        datasetFacts({ hasSubscription: false, unitId: "unit-one", username: administrator }),
      ),
    ).toEqual(disabled(unreadableSubscriptionReasons.files));
  });

  test("is withheld where no unit could be named for the project", () => {
    expect(
      evaluateProjectDatasetCreationCapability(datasetFacts({ username: administrator })),
    ).toEqual(disabled(unknownUnitReason));
  });
});

test.describe("Capability presentation", () => {
  test("only hidden capabilities withhold their reason", () => {
    const hidden: ProjectCapability = { status: "hidden" };
    expect(capabilityReason(hidden)).toBeUndefined();
    expect(capabilityReason({ status: "enabled" })).toBeUndefined();
    const deferred = unconfirmed("You must be someone.") as ProjectCapability;
    expect(capabilityReason(deferred)).toBe(
      "You must be someone. Your permission will be confirmed when you use this action.",
    );
    expect(capabilityReason(disabled("Because.") as ProjectCapability)).toBe("Because.");
  });
});

test.describe("Project subscription facts", () => {
  const coins = {
    allowance: 100,
    allowance_multiplier: 1,
    at_limit: false,
    billing_day: 1,
    billing_prediction: 12,
    billing_prediction_storage_contribution: 2,
    current_burn_rate: 3,
    limit: 200,
    overspend_multiplier: 2,
    remaining_days: 30,
    used: 25,
  };
  const storage = {
    coins: { unit_cost: 1, used: 5 },
    size: { current: "1 GB", peak: "2 GB", unit_size: "1 GB", units_used: 1 },
  };

  test("project-tier subscriptions expose tier, quota, usage, and instance facts", () => {
    const product = {
      claimable: true,
      coins,
      instance: { coins: { used: 20 } },
      product: {
        created: "2026-01-02T03:04:05Z",
        flavour: "BRONZE",
        id: productId,
        type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      },
      storage,
    } as ProductDmProjectTier;

    expect(describeProjectSubscription(product)).toEqual({
      accountsForInstances: true,
      allowance: 100,
      atLimit: false,
      billingDay: 1,
      burnRate: 3,
      instanceCoinsUsed: 20,
      limit: 200,
      prediction: 12,
      productId,
      remainingDays: 30,
      storageCoinsUsed: 5,
      storageSize: "1 GB",
      tier: "Bronze",
      type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      used: 25,
    });
  });

  test("a storage subscription keeps its billing facts without inventing a tier or instances", () => {
    const product = {
      claimable: false,
      coins: { ...coins, at_limit: true },
      product: {
        created: "2026-01-02T03:04:05Z",
        id: productId,
        type: "DATA_MANAGER_STORAGE_SUBSCRIPTION",
      },
      storage,
    } as ProductDmStorage;

    expect(describeProjectSubscription(product)).toEqual({
      accountsForInstances: false,
      allowance: 100,
      atLimit: true,
      billingDay: 1,
      burnRate: 3,
      instanceCoinsUsed: undefined,
      limit: 200,
      prediction: 12,
      productId,
      remainingDays: 30,
      storageCoinsUsed: 5,
      storageSize: "1 GB",
      tier: undefined,
      type: "DATA_MANAGER_STORAGE_SUBSCRIPTION",
      used: 25,
    });
  });
});
