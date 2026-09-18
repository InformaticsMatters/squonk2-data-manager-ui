import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
  type ProductsGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";

import { expect, test } from "@playwright/test";

import { clearAccountScopedStorageOnLogout } from "../../src/application/logoutCleanup";
import { evaluateDatasetUploadCapability } from "../../src/datasets/capabilities";
import {
  DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY,
  datasetSubscriptionOf,
  eligibleBillingUnits,
  evaluateDatasetSubscriptionRecovery,
  forgetRememberedBillingUnit,
  readRememberedBillingUnitId,
  rememberBillingUnitId,
  resolveBillingUnitChoice,
} from "../../src/datasets/uploadBilling";
import {
  classifyDatasetUpload,
  datasetUploadBatchIsCommitted,
  datasetUploadIsRetryable,
  datasetUploadIsSendable,
  datasetUploadPollInterval,
  type DatasetUploadRecord,
  datasetUploadRecordOf,
  datasetUploadRequestFailure,
  pendingUploadFileIds,
  resetDatasetUploads,
  settleDatasetUpload,
  withDatasetUploadRecord,
} from "../../src/datasets/uploadLifecycle";
import { RECENT_PROJECTS_STORAGE_KEY } from "../../src/projects/recentProjects";

const created = "2026-01-02T03:04:05Z";
const unitId = "unit-55555555-5555-5555-5555-555555555555";
const otherUnitId = "unit-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const organisation = (callerIsMember: boolean): OrganisationAllDetail => ({
  caller_is_member: callerIsMember,
  created,
  default_product_privacy: "DEFAULT_PRIVATE",
  id: "org-22222222-2222-2222-2222-222222222222",
  name: "Acceptance Organisation",
  owner_id: "owner",
  private: true,
  users: [],
});

const unit = (id: string, callerIsMember: boolean): UnitAllDetail => ({
  billing_day: 1,
  caller_is_member: callerIsMember,
  created,
  default_product_privacy: "DEFAULT_PRIVATE",
  id,
  name: `Unit ${id.slice(5, 9)}`,
  owner_id: "owner",
  private: true,
  users: [],
});

const groups = (): OrganisationUnitsGetResponse[] => [
  { organisation: organisation(true), units: [unit(unitId, true), unit(otherUnitId, false)] },
];

const storageProduct = {
  organisation: organisation(true),
  product: { created, id: "product-77777777-7777-7777-7777-777777777777", name: "Dataset Storage" },
  unit: unit(unitId, true),
} as const;

const products = (type: string): ProductsGetResponse =>
  ({
    count: 1,
    products: [{ ...storageProduct, product: { ...storageProduct.product, type } }],
  }) as ProductsGetResponse;

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => void values.delete(key),
    setItem: (key: string, value: string) => void values.set(key, value),
    values,
  };
};

test.describe("Dataset upload billing eligibility", () => {
  test("only units the generated index reports the caller is a member of are eligible", () => {
    expect(eligibleBillingUnits(groups()).map(({ unit: eligible }) => eligible.id)).toEqual([
      unitId,
    ]);
    expect(eligibleBillingUnits([])).toEqual([]);
  });

  test("eligible units keep the organisation the generated index grouped them under", () => {
    const [eligible] = eligibleBillingUnits(groups());
    expect(eligible.organisation.name).toBe("Acceptance Organisation");
  });

  test("no eligible unit disables the action with guidance rather than hiding it", () => {
    const capability = evaluateDatasetUploadCapability({ eligibleUnitCount: 0 });
    expect(capability.status).toBe("disabled");
    expect(capability.status === "disabled" && capability.reason).toContain("member of a unit");
  });

  test("unresolved membership is never presented as an absence of units", () => {
    // A unit index that has not answered and one that could not answer are the same fact: the
    // caller's memberships are unknown, which is not the same as having none.
    const capability = evaluateDatasetUploadCapability({
      eligibleUnitCount: 0,
      freshness: "stale",
    });
    expect(capability).toEqual({
      reason: "Unit membership is still being confirmed.",
      status: "disabled",
    });
  });

  test("an eligible unit enables the action", () => {
    expect(
      evaluateDatasetUploadCapability({ eligibleUnitCount: eligibleBillingUnits(groups()).length }),
    ).toEqual({ status: "enabled" });
  });
});

test.describe("Dataset upload billing choice", () => {
  const eligible = eligibleBillingUnits(groups());

  test("nothing is selected without an explicit or remembered choice", () => {
    expect(resolveBillingUnitChoice({ eligible })).toEqual({ kind: "none" });
  });

  test("an explicit choice is used and named as explicit", () => {
    expect(resolveBillingUnitChoice({ chosenUnitId: unitId, eligible })).toEqual({
      kind: "chosen",
      unitId,
    });
  });

  test("a remembered choice is only used while it is still eligible", () => {
    expect(resolveBillingUnitChoice({ eligible, rememberedUnitId: unitId })).toEqual({
      kind: "remembered",
      unitId,
    });
    expect(resolveBillingUnitChoice({ eligible, rememberedUnitId: otherUnitId })).toEqual({
      kind: "none",
    });
    expect(resolveBillingUnitChoice({ eligible: [], rememberedUnitId: unitId })).toEqual({
      kind: "none",
    });
  });

  test("an explicit choice outranks a remembered one and an ineligible one selects nothing", () => {
    expect(
      resolveBillingUnitChoice({ chosenUnitId: unitId, eligible, rememberedUnitId: otherUnitId }),
    ).toEqual({ kind: "chosen", unitId });
    expect(
      resolveBillingUnitChoice({ chosenUnitId: otherUnitId, eligible, rememberedUnitId: unitId }),
    ).toEqual({ kind: "remembered", unitId });
  });
});

test.describe("Remembered billing unit storage", () => {
  test("round trips a unit identity the Account Server would recognise", () => {
    const storage = createStorage();
    rememberBillingUnitId(storage, unitId);
    expect(readRememberedBillingUnitId(storage)).toBe(unitId);
    expect(storage.values.has(DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY)).toBe(true);
  });

  test("malformed, unversioned, and non-unit payloads are read as no memory at all", () => {
    const storage = createStorage();
    for (const value of [
      "not-json",
      JSON.stringify({ unitId, version: 2 }),
      JSON.stringify({ unitId: "project-33333333-3333-3333-3333-333333333333", version: 1 }),
      JSON.stringify({ version: 1 }),
      JSON.stringify(null),
    ]) {
      storage.values.set(DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY, value);
      expect(readRememberedBillingUnitId(storage)).toBeUndefined();
    }
    expect(readRememberedBillingUnitId(createStorage())).toBeUndefined();
  });

  test("forgetting removes the memory without touching anything else", () => {
    const storage = createStorage();
    storage.setItem("data-manager-ui-current-organisation", "kept");
    rememberBillingUnitId(storage, unitId);
    forgetRememberedBillingUnit(storage);
    expect(readRememberedBillingUnitId(storage)).toBeUndefined();
    expect(storage.getItem("data-manager-ui-current-organisation")).toBe("kept");
  });

  test("logging out forgets the remembered unit along with the rest of the session", () => {
    const storage = createStorage();
    rememberBillingUnitId(storage, unitId);
    storage.setItem(RECENT_PROJECTS_STORAGE_KEY, '["project"]');
    storage.setItem("data-manager-ui-current-project", "project");
    storage.setItem("data-manager-ui-cookie-consent", "consent");

    clearAccountScopedStorageOnLogout({ local: storage, session: createStorage() });

    expect(readRememberedBillingUnitId(storage)).toBeUndefined();
    // Preferences that belong to the browser rather than to the account survive the logout.
    expect([...storage.values]).toEqual([["data-manager-ui-cookie-consent", "consent"]]);
  });
});

test.describe("Dataset subscription recovery", () => {
  test("a dataset subscription is recognised by its generated product type alone", () => {
    expect(datasetSubscriptionOf(products("DATA_MANAGER_STORAGE_SUBSCRIPTION"))?.product.id).toBe(
      storageProduct.product.id,
    );
    expect(
      datasetSubscriptionOf(products("DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION")),
    ).toBeUndefined();
    expect(datasetSubscriptionOf({ products: [] })).toBeUndefined();
  });

  test("unit or organisation membership opens the subscriptions of the unit that needs one", () => {
    for (const facts of [
      { organisation: organisation(false), unit: unit(unitId, true) },
      { organisation: organisation(true), unit: unit(unitId, false) },
    ]) {
      expect(
        evaluateDatasetSubscriptionRecovery({
          caller: { isEvaluator: false },
          isPersonalUnit: false,
          ...facts,
        }),
        // The advice lands on the unit the upload chose, which is where the missing subscription
        // would be created, rather than on a list the caller would have to search again.
      ).toEqual({ href: `/administration/units/${unitId}/subscriptions`, kind: "administration" });
    }
  });

  test("a caller who could not create the subscription is given contact guidance", () => {
    const recovery = evaluateDatasetSubscriptionRecovery({
      caller: { isEvaluator: false },
      isPersonalUnit: false,
      organisation: organisation(false),
      unit: unit(unitId, false),
    });
    expect(recovery?.kind).toBe("contact");
  });

  test("an evaluator only manages subscriptions in its own personal unit", () => {
    const evaluator = { caller: { isEvaluator: true }, organisation: organisation(true) };
    expect(
      evaluateDatasetSubscriptionRecovery({
        ...evaluator,
        isPersonalUnit: false,
        unit: unit(unitId, true),
      })?.kind,
    ).toBe("contact");
    expect(
      evaluateDatasetSubscriptionRecovery({
        ...evaluator,
        isPersonalUnit: true,
        unit: unit(unitId, true),
      })?.kind,
    ).toBe("administration");
  });

  test("an evaluator is told nothing until its own personal unit is established", () => {
    // Until the personal-unit read answers, an evaluator on its own unit and one on somebody
    // else's are indistinguishable, so neither is given guidance that may be about to be wrong.
    expect(
      evaluateDatasetSubscriptionRecovery({
        caller: { isEvaluator: true },
        organisation: organisation(true),
        unit: unit(unitId, true),
      }),
    ).toBeUndefined();
    // Every other caller is answered without waiting for a fact only the evaluator rule reads.
    expect(
      evaluateDatasetSubscriptionRecovery({
        caller: { isEvaluator: false },
        organisation: organisation(true),
        unit: unit(unitId, true),
      })?.kind,
    ).toBe("administration");
  });

  test("unreadable ancestry never invents an authority the caller does not hold", () => {
    expect(
      evaluateDatasetSubscriptionRecovery({
        caller: { isEvaluator: false },
        isPersonalUnit: false,
        unit: unit(unitId, false),
      })?.kind,
    ).toBe("contact");
  });

  test("every unit this form can bill is one its caller could also subscribe", () => {
    // Eligibility already requires membership, so the recovery a batch can actually reach is
    // Administration for anyone but an evaluator outside its own personal unit. The membership
    // test remains the authority rather than an assumption about who was offered the unit.
    for (const { organisation: parent, unit: eligible } of eligibleBillingUnits(groups())) {
      expect(eligible.caller_is_member).toBe(true);
      expect(
        evaluateDatasetSubscriptionRecovery({
          caller: { isEvaluator: false },
          isPersonalUnit: false,
          organisation: parent,
          unit: eligible,
        }),
      ).toEqual({
        href: `/administration/units/${eligible.id}/subscriptions`,
        kind: "administration",
      });
    }
  });
});

const taskId = "task-44444444-4444-4444-4444-444444444444";

test.describe("Dataset upload task classification", () => {
  test("a request that has not been made or is in flight is never processing", () => {
    expect(classifyDatasetUpload({ record: { kind: "idle" } })).toEqual({ kind: "idle" });
    expect(classifyDatasetUpload({ record: { kind: "sending", progress: 42 } })).toEqual({
      kind: "sending",
      progress: 42,
    });
  });

  test("a refused request keeps its own reason and never reaches a task", () => {
    expect(
      classifyDatasetUpload({ record: { kind: "request-failed", reason: "Unsupported type" } }),
    ).toEqual({ kind: "request-failed", reason: "Unsupported type" });
  });

  const sendFailure = "This upload could not be sent. Retry this file.";

  test("a refusal reports what the Data Manager said, or what the transport did", () => {
    // The Data Manager knows things this client does not, so its own words win where it gave any.
    expect(
      datasetUploadRequestFailure({
        isAxiosError: true,
        response: { data: { error: "Unsupported dataset type" }, status: 400 },
      }),
    ).toEqual({ kind: "request-failed", reason: "Unsupported dataset type" });

    const cases = [
      { data: {}, expected: "You are not allowed to upload a dataset to this unit.", status: 403 },
      { data: {}, expected: "The Data Manager refused this upload.", status: 400 },
      // A transport that failed on the way explains nothing about this upload, so its body is not
      // offered as a reason even when it carried one.
      { data: { error: "gateway exploded" }, expected: sendFailure, status: 503 },
      { data: { error: "slow down" }, expected: sendFailure, status: 429 },
    ];
    for (const { data, expected, status } of cases) {
      expect(
        datasetUploadRequestFailure({ isAxiosError: true, response: { data, status } }),
      ).toEqual({ kind: "request-failed", reason: expected });
    }
    // Every refusal is retryable, because none of them created a task.
    for (const error of [new Error("boom"), undefined, "nonsense"]) {
      const failure = datasetUploadRequestFailure(error);
      expect(failure.kind).toBe("request-failed");
      expect(datasetUploadIsRetryable(failure)).toBe(true);
    }
  });

  test("an accepted request polls until the task answers", () => {
    expect(classifyDatasetUpload({ record: { kind: "accepted", taskId } })).toEqual({
      kind: "processing",
      taskId,
    });
    expect(
      classifyDatasetUpload({ record: { kind: "accepted", taskId }, task: { done: false } }),
    ).toEqual({ kind: "processing", taskId });
  });

  test("only a done task with exit code zero is success", () => {
    expect(
      classifyDatasetUpload({
        record: { kind: "accepted", taskId },
        task: { done: true, exit_code: 0 },
      }),
    ).toEqual({ kind: "processed", taskId });
  });

  test("a nonzero or absent exit code is a failure that names what happened", () => {
    const nonZero = classifyDatasetUpload({
      record: { kind: "accepted", taskId },
      task: { done: true, exit_code: 17 },
    });
    expect(nonZero.kind).toBe("processing-failed");
    expect(nonZero.kind === "processing-failed" && nonZero.reason).toContain("17");
    expect(
      classifyDatasetUpload({ record: { kind: "accepted", taskId }, task: { done: true } }).kind,
    ).toBe("processing-failed");
  });

  test("a recorded failure state is a failure even when the task exits zero", () => {
    const domainFailure = classifyDatasetUpload({
      record: { kind: "accepted", taskId },
      task: {
        done: true,
        exit_code: 0,
        states: [
          { state: "STARTED" },
          { message: "The molecule loader rejected the file.", state: "FAILURE" },
        ],
      },
    });
    expect(domainFailure.kind).toBe("processing-failed");
    expect(domainFailure.kind === "processing-failed" && domainFailure.reason).toBe(
      "The molecule loader rejected the file.",
    );
    expect(
      classifyDatasetUpload({
        record: { kind: "accepted", taskId },
        task: { done: true, exit_code: 0, states: [{ state: "FAILURE" }] },
      }).kind,
    ).toBe("processing-failed");
    expect(
      classifyDatasetUpload({
        record: { kind: "accepted", taskId },
        task: { done: true, exit_code: 0, states: [{ state: "SUCCESS" }] },
      }).kind,
    ).toBe("processed");
  });

  test("a transient read failure leaves processing unconfirmed rather than failed", () => {
    for (const error of [
      { isAxiosError: true, response: { status: 503 } },
      { isAxiosError: true, response: { status: 429 } },
      new Error("boom"),
    ]) {
      const state = classifyDatasetUpload({
        record: { kind: "accepted", taskId },
        taskError: error,
      });
      expect(["processing-unconfirmed", "processing-unknown"]).toContain(state.kind);
    }
    expect(
      classifyDatasetUpload({
        record: { kind: "accepted", taskId },
        taskError: { isAxiosError: true, response: { status: 503 } },
      }).kind,
    ).toBe("processing-unconfirmed");
  });

  test("an authoritative or unrecognised read failure backs off instead of polling", () => {
    for (const status of [403, 404]) {
      expect(
        classifyDatasetUpload({
          record: { kind: "accepted", taskId },
          taskError: { isAxiosError: true, response: { status } },
        }).kind,
      ).toBe("processing-unknown");
    }
    expect(
      classifyDatasetUpload({ record: { kind: "accepted", taskId }, taskError: new Error("boom") })
        .kind,
    ).toBe("processing-unknown");
  });

  test("a settled task outranks a later read failure", () => {
    expect(
      classifyDatasetUpload({
        record: { kind: "accepted", taskId },
        task: { done: true, exit_code: 0 },
        taskError: { isAxiosError: true, response: { status: 503 } },
      }),
    ).toEqual({ kind: "processed", taskId });
  });

  test("a settled record answers without consulting a task again", () => {
    expect(classifyDatasetUpload({ record: { kind: "processed", taskId } })).toEqual({
      kind: "processed",
      taskId,
    });
    expect(
      classifyDatasetUpload({
        record: { kind: "processing-failed", reason: "Exit code 17", taskId },
        task: { done: true, exit_code: 0 },
      }),
    ).toEqual({ kind: "processing-failed", reason: "Exit code 17", taskId });
  });

  test("polling stops on every state that is not waiting for a task", () => {
    expect(datasetUploadPollInterval({ kind: "processing", taskId })).toBe(2000);
    expect(datasetUploadPollInterval({ kind: "processing-unconfirmed", reason: "x", taskId })).toBe(
      8000,
    );
    for (const state of [
      { kind: "idle" },
      { kind: "sending", progress: 10 },
      { kind: "processed", taskId },
      { kind: "processing-failed", reason: "x", taskId },
      { kind: "processing-unknown", reason: "x", taskId },
      { kind: "request-failed", reason: "x" },
    ] as const) {
      expect(datasetUploadPollInterval(state)).toBe(false);
    }
  });

  test("only a settled state is written back into the record it came from", () => {
    expect(settleDatasetUpload({ kind: "processed", taskId })).toEqual({
      kind: "processed",
      taskId,
    });
    expect(settleDatasetUpload({ kind: "processing-failed", reason: "x", taskId })).toEqual({
      kind: "processing-failed",
      reason: "x",
      taskId,
    });
    expect(settleDatasetUpload({ kind: "processing-unknown", reason: "x", taskId })).toEqual({
      kind: "processing-unknown",
      reason: "x",
      taskId,
    });
    expect(settleDatasetUpload({ kind: "processing", taskId })).toBeUndefined();
    expect(
      settleDatasetUpload({ kind: "processing-unconfirmed", reason: "x", taskId }),
    ).toBeUndefined();
  });
});

test.describe("Dataset upload per-file records", () => {
  const records: Record<string, DatasetUploadRecord> = {
    first: { kind: "sending", progress: 10 },
    second: { kind: "accepted", taskId },
  };

  test("an unrecorded file starts idle without being written to", () => {
    expect(datasetUploadRecordOf({}, "first")).toEqual({ kind: "idle" });
  });

  test("a functional update changes one identity and returns a new collection", () => {
    const next = withDatasetUploadRecord(records, "first", (current) =>
      current.kind === "sending" ? { kind: "sending", progress: current.progress + 50 } : current,
    );
    expect(next.first).toEqual({ kind: "sending", progress: 60 });
    expect(next.second).toEqual(records.second);
    expect(records.first).toEqual({ kind: "sending", progress: 10 });
  });

  test("concurrent progress and acceptance for different files never overwrite each other", () => {
    const next = withDatasetUploadRecord(
      withDatasetUploadRecord(records, "second", { kind: "processed", taskId }),
      "first",
      { kind: "sending", progress: 99 },
    );
    expect(next).toEqual({
      first: { kind: "sending", progress: 99 },
      second: { kind: "processed", taskId },
    });
  });

  test("only a file that failed or was never attempted may be sent", () => {
    for (const record of [
      { kind: "request-failed", reason: "x" },
      { kind: "processing-failed", reason: "x", taskId },
      { kind: "processing-unknown", reason: "x", taskId },
    ] as const) {
      expect(datasetUploadIsRetryable(record)).toBe(true);
      expect(datasetUploadIsSendable(record)).toBe(true);
    }
    expect(datasetUploadIsRetryable({ kind: "idle" })).toBe(false);
    expect(datasetUploadIsSendable({ kind: "idle" })).toBe(true);
    // Work the Data Manager already holds is sendable by no route at all, so nothing that names a
    // file — a retry included — can enter it twice.
    for (const record of [
      { kind: "processed", taskId },
      { kind: "accepted", taskId },
      { kind: "sending", progress: 1 },
    ] as const) {
      expect(datasetUploadIsRetryable(record)).toBe(false);
      expect(datasetUploadIsSendable(record)).toBe(false);
    }
  });

  test("a submission sends every file that has not been accepted or processed", () => {
    const files = [{ id: "idle" }, { id: "failed" }, { id: "processed" }, { id: "sending" }];
    expect(
      pendingUploadFileIds(files, {
        failed: { kind: "request-failed", reason: "x" },
        processed: { kind: "processed", taskId },
        sending: { kind: "sending", progress: 1 },
      }),
    ).toEqual(["idle", "failed"]);
  });

  test("a batch commits to its unit once a file reaches the Data Manager", () => {
    expect(datasetUploadBatchIsCommitted({})).toBe(false);
    expect(datasetUploadBatchIsCommitted({ only: { kind: "idle" } })).toBe(false);
    // Nothing was accepted, so the batch may still be billed somewhere else.
    expect(datasetUploadBatchIsCommitted({ only: { kind: "request-failed", reason: "x" } })).toBe(
      false,
    );
    for (const record of [
      { kind: "sending", progress: 0 },
      { kind: "accepted", taskId },
      { kind: "processed", taskId },
      { kind: "processing-failed", reason: "x", taskId },
      { kind: "processing-unknown", reason: "x", taskId },
    ] as const) {
      expect(
        datasetUploadBatchIsCommitted({
          failed: { kind: "request-failed", reason: "x" },
          only: record,
        }),
      ).toBe(true);
    }
  });

  test("a reset keeps only the records of files that are still present", () => {
    expect(resetDatasetUploads(records, [{ id: "second" }])).toEqual({ second: records.second });
    expect(resetDatasetUploads(records, [])).toEqual({});
  });
});
