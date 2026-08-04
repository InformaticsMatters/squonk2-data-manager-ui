import {
  AppApiOrganisationGetChargesResponse,
  AppApiProductGetChargesResponse,
  AppApiUnitGetChargesResponse,
} from "@/api/account-server/charges/zod";
import { AppApiEventStreamGetEventStreamVersionResponse } from "@/api/account-server/event-stream/zod";
import {
  AppApiOrganisationGetDefaultResponse,
  AppApiOrganisationGetOrgResponse,
  AppApiOrganisationGetResponse,
} from "@/api/account-server/organisation/zod";
import { AppApiProductGetResponse } from "@/api/account-server/product/zod";
import { AppApiStateGetVersionResponse } from "@/api/account-server/state/zod";
import {
  AppApiUnitGetResponse,
  AppApiUnitPersonalGetResponse,
} from "@/api/account-server/unit/zod";
import { AppApiUserGetAccountResponse } from "@/api/account-server/user/zod";
import { AppApiVersionGetResponse } from "@/api/data-manager/accounting/zod";
import {
  AppApiDatasetGetResponse,
  AppApiDatasetPostResponse,
} from "@/api/data-manager/dataset/zod";
import { AppApiProjectGetResponse } from "@/api/data-manager/project/zod";
import { AppApiTaskGetTaskResponse } from "@/api/data-manager/task/zod";
import { AppApiTypeGetResponse } from "@/api/data-manager/type/zod";
import { AppApiUserGetResponse } from "@/api/data-manager/user/zod";

import { gzipSync } from "node:zlib";

const created = "2026-01-02T03:04:05Z";

export const fixtureIds = {
  createdOrganisation: "org-0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a",
  createdUnit: "unit-0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b",
  dataset: "dataset-11111111-1111-1111-1111-111111111111",
  defaultOrganisation: "org-0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d0d",
  personalUnit: "unit-0e0e0e0e-0e0e-4e0e-8e0e-0e0e0e0e0e0e",
  missingDataset: "dataset-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  otherDataset: "dataset-cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  versionlessDataset: "dataset-dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  organisation: "org-22222222-2222-2222-2222-222222222222",
  otherOrganisation: "org-66666666-6666-6666-6666-666666666666",
  product: "product-77777777-7777-7777-7777-777777777777",
  project: "project-33333333-3333-3333-3333-333333333333",
  sharedProjectOne: "project-88888888-8888-4888-8888-888888888888",
  sharedProjectTwo: "project-99999999-9999-4999-8999-999999999999",
  partnerProject: "project-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  task: "task-44444444-4444-4444-4444-444444444444",
  unit: "unit-55555555-5555-5555-5555-555555555555",
  otherUnit: "unit-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
} as const;

export const datasetContentFixtures = {
  1: gzipSync(Buffer.from("acceptance dataset version 1\n")),
  2: gzipSync(Buffer.from("acceptance dataset version 2\n")),
} as const;

export const scenarioProfiles = [
  "default",
  "empty-charges",
  "empty-products",
  "no-personal-unit",
  "platform-admin",
  "read-only",
] as const;
export type ScenarioProfile = (typeof scenarioProfiles)[number];
export const isScenarioProfile = (value: string): value is ScenarioProfile =>
  scenarioProfiles.includes(value as ScenarioProfile);

export const createScenarioFixtures = (subject: string, profile: ScenarioProfile = "default") => {
  const colleague = `${subject}-observer`;
  const readOnly = profile === "read-only";
  const emptyCharges = profile === "empty-charges";
  const platformAdmin = profile === "platform-admin";
  const owner = readOnly || platformAdmin ? `${subject}-owner` : subject;
  const callerIsMember = !readOnly && !platformAdmin;
  const organisation = {
    caller_is_member: callerIsMember,
    created,
    default_product_privacy: "DEFAULT_PRIVATE" as const,
    id: fixtureIds.organisation,
    name: "Acceptance Organisation",
    owner_id: owner,
    private: true,
    users: [{ id: subject }, { id: colleague }],
  };
  const otherOrganisation = {
    ...organisation,
    id: fixtureIds.otherOrganisation,
    name: "Partner Organisation",
  };
  const defaultOrganisation = {
    caller_is_member: platformAdmin,
    created,
    default_product_privacy: "ALWAYS_PRIVATE" as const,
    id: fixtureIds.defaultOrganisation,
    name: "Default Organisation",
    private: false,
    users: [],
  };
  const unit = {
    billing_day: 1,
    caller_is_member: callerIsMember,
    created,
    default_product_privacy: "DEFAULT_PRIVATE" as const,
    id: fixtureIds.unit,
    name: "Acceptance Unit",
    owner_id: owner,
    private: true,
    users: [{ id: subject }, { id: colleague }],
  };
  const otherUnit = { ...unit, id: fixtureIds.otherUnit, name: "Screening Unit" };
  const personalUnit = {
    billing_day: 1,
    caller_is_member: true,
    created,
    default_product_privacy: "ALWAYS_PRIVATE" as const,
    id: fixtureIds.personalUnit,
    name: subject,
    owner_id: subject,
    private: true,
    users: [{ id: subject }],
  };
  const hasPersonalUnit = profile !== "no-personal-unit";
  const products = AppApiProductGetResponse.parse({
    count: 1,
    products: [
      {
        claimable: true,
        claim: { id: fixtureIds.project, name: "Acceptance Project" },
        coins: {
          allowance: 100,
          allowance_multiplier: 1,
          at_limit: false,
          billing_day: 1,
          billing_prediction: 0,
          billing_prediction_storage_contribution: 0,
          current_burn_rate: 0,
          limit: 100,
          overspend_multiplier: 1,
          remaining_days: 30,
          used: 0,
        },
        instance: { coins: { used: 0 } },
        organisation,
        product: {
          created,
          flavour: "BRONZE",
          id: fixtureIds.product,
          type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
        },
        storage: {
          coins: { unit_cost: 1, used: 0 },
          size: { current: "0 B", peak: "0 B", unit_size: "1 GB", units_used: 0 },
        },
        unit,
      },
    ],
  });

  return {
    accountServerVersion: AppApiStateGetVersionResponse.parse({ version: "4.7.0-acceptance" }),
    dataset: AppApiDatasetGetResponse.parse({
      count: 3,
      datasets: [
        {
          dataset_id: fixtureIds.dataset,
          editors: [subject],
          versions: [
            {
              file_name: "acceptance-dataset-v2.sdf",
              labels: { scenario: ["current"] },
              owner: subject,
              processing_stage: "DONE",
              projects: [],
              published: "2026-01-03T03:04:05Z",
              size: datasetContentFixtures[2].length,
              source_ref: "acceptance-dataset-v2.sdf",
              type: "chemical/x-mdl-sdfile",
              version: 2,
            },
            {
              file_name: "acceptance-dataset-v1.sdf",
              labels: { scenario: ["deterministic"] },
              owner: subject,
              processing_stage: "DONE",
              projects: [fixtureIds.project],
              published: created,
              size: datasetContentFixtures[1].length,
              source_ref: "acceptance-dataset-v1.sdf",
              type: "chemical/x-mdl-sdfile",
              version: 1,
            },
          ],
        },
        {
          dataset_id: fixtureIds.otherDataset,
          editors: [colleague],
          versions: [
            {
              file_name: "globally-shared.csv",
              owner: colleague,
              processing_stage: "DONE",
              projects: [],
              published: created,
              size: 12,
              source_ref: "globally-shared.csv",
              type: "text/csv",
              version: 1,
            },
          ],
        },
        { dataset_id: fixtureIds.versionlessDataset, editors: [subject], versions: [] },
      ],
    }),
    datasetSchemas: {
      1: {
        description: "Version one schema",
        fields: {
          version_one_field: { description: "Only present in version one", type: "string" },
        },
        required: ["version_one_field"],
        title: "Version one",
        type: "object",
      },
      2: {
        description: "Version two schema",
        fields: {
          version_two_field: { description: "Only present in version two", type: "string" },
        },
        required: ["version_two_field"],
        title: "Version two",
        type: "object",
      },
    },
    dataManagerVersion: AppApiVersionGetResponse.parse({ version: "6.7.0-acceptance" }),
    eventStream: AppApiEventStreamGetEventStreamVersionResponse.parse({
      name: "deterministic-fixture",
      protocol: "SERVICE_NOT_PRESENT",
      version: "1.0.0",
    }),
    failures: {
      forbidden: { error: "fixture-forbidden" },
      rateLimited: { error: "fixture-rate-limited" },
      serverError: { error: "fixture-server-error" },
    },
    callerAccount: AppApiUserGetAccountResponse.parse({
      account_server_roles: platformAdmin ? ["admin", "user"] : ["user"],
      caller_has_admin_privilege: platformAdmin,
      user: { id: subject },
    }),
    defaultOrganisation: AppApiOrganisationGetDefaultResponse.parse(defaultOrganisation),
    defaultOrganisationDetail: defaultOrganisation,
    personalUnit: AppApiUnitPersonalGetResponse.parse(personalUnit),
    subject,
    organisation: AppApiOrganisationGetOrgResponse.parse(organisation),
    organisations: AppApiOrganisationGetResponse.parse({
      count: 3,
      organisations: [organisation, otherOrganisation, defaultOrganisation],
    }),
    otherOrganisation: AppApiOrganisationGetOrgResponse.parse(otherOrganisation),
    organisationCharges: AppApiOrganisationGetChargesResponse.parse({
      coins: emptyCharges ? "0" : "7.5",
      name: organisation.name,
      organisation_id: organisation.id,
      summary: emptyCharges
        ? []
        : [
            { coins: "2.5", type: "PROCESSING" },
            { coins: "5", type: "STORAGE" },
          ],
      unit_charges: emptyCharges
        ? []
        : [
            {
              billing_day: unit.billing_day,
              from: "2026-07-01",
              name: unit.name,
              summary: [
                { coins: "2.5", type: "PROCESSING" },
                { coins: "5", type: "STORAGE" },
              ],
              unit_id: unit.id,
              until: "2026-08-01",
            },
          ],
    }),
    projects: AppApiProjectGetResponse.parse({
      count: 4,
      projects: [
        {
          administrators: [subject],
          created,
          creator: subject,
          editors: [subject],
          files: [],
          name: "Acceptance Project",
          observers: [colleague],
          organisation_id: fixtureIds.organisation,
          private: true,
          product_id: fixtureIds.product,
          project_id: fixtureIds.project,
          size: 0,
          unit_id: fixtureIds.unit,
        },
        {
          administrators: [subject],
          created,
          creator: subject,
          editors: [subject],
          files: [],
          name: "Shared Project",
          observers: [],
          organisation_id: fixtureIds.organisation,
          private: true,
          project_id: fixtureIds.sharedProjectOne,
          size: 0,
          unit_id: fixtureIds.unit,
        },
        {
          administrators: [subject],
          created,
          creator: subject,
          editors: [subject],
          files: [],
          name: "Shared Project",
          observers: [],
          organisation_id: fixtureIds.organisation,
          private: true,
          project_id: fixtureIds.sharedProjectTwo,
          size: 0,
          unit_id: fixtureIds.otherUnit,
        },
        {
          administrators: [subject],
          created,
          creator: subject,
          editors: [subject],
          files: [],
          name: "Partner Project",
          observers: [],
          organisation_id: fixtureIds.otherOrganisation,
          private: true,
          project_id: fixtureIds.partnerProject,
          size: 0,
          unit_id: fixtureIds.unit,
        },
      ],
    }),
    products:
      profile === "empty-products"
        ? AppApiProductGetResponse.parse({ count: 0, products: [] })
        : products,
    productCharges: AppApiProductGetChargesResponse.parse({
      billing_day: unit.billing_day,
      claim: { id: fixtureIds.project, name: "Acceptance Project" },
      claimable: true,
      coins: emptyCharges ? "0" : "7.5",
      count: emptyCharges ? 0 : 2,
      from: "2026-07-01",
      processing_charges: emptyCharges
        ? []
        : [
            {
              charge: {
                additional_data: {
                  job_collection: "Acceptance Collection",
                  job_job: "Acceptance Job",
                },
                coins: "2.5",
                id: 1,
                sqn: 1,
                timestamp: created,
                username: subject,
              },
              closed: "2026-01-02T04:04:05Z",
              final: true,
              merchant_api_hostname: "data-manager.example.test",
              merchant_kind: "DATA_MANAGER",
              merchant_name: "Data Manager",
            },
          ],
      product_id: fixtureIds.product,
      product_type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      storage_charges: {
        items: emptyCharges
          ? []
          : [
              {
                additional_data: { peak_bytes: 1_000_000 },
                coins: "5",
                date: "2026-07-31",
                item_number: 1,
              },
            ],
        num_items: emptyCharges ? 0 : 1,
      },
      until: "2026-08-01",
    }),
    taskTransitions: [
      AppApiTaskGetTaskResponse.parse({
        created,
        done: false,
        purpose: "DATASET",
        purpose_id: fixtureIds.dataset,
        states: [{ state: "PENDING", time: created }],
      }),
      AppApiTaskGetTaskResponse.parse({
        created,
        done: false,
        purpose: "DATASET",
        purpose_id: fixtureIds.dataset,
        states: [
          { state: "PENDING", time: created },
          { state: "STARTED", time: "2026-01-02T03:04:06Z" },
        ],
      }),
      AppApiTaskGetTaskResponse.parse({
        created,
        done: true,
        exit_code: 0,
        purpose: "DATASET",
        purpose_id: fixtureIds.dataset,
        states: [{ state: "SUCCESS", time: "2026-01-02T03:04:07Z" }],
      }),
    ],
    types: AppApiTypeGetResponse.parse({
      count: 1,
      types: [{ file_extensions: [".sdf"], mime: "chemical/x-mdl-sdfile" }],
    }),
    units: AppApiUnitGetResponse.parse({
      units: [
        { count: 2, organisation, units: [unit, otherUnit] },
        ...(hasPersonalUnit
          ? [{ count: 1, organisation: defaultOrganisation, units: [personalUnit] }]
          : []),
      ],
    }),
    unitCharges: AppApiUnitGetChargesResponse.parse({
      billing_day: unit.billing_day,
      caller_is_member: true,
      coins: emptyCharges ? "0" : "7.5",
      count: emptyCharges ? 0 : 1,
      created: unit.created,
      from: "2026-07-01",
      name: unit.name,
      owner_id: unit.owner_id,
      private: unit.private,
      products: emptyCharges
        ? []
        : [
            {
              charges: [
                { coins: "2.5", type: "PROCESSING" },
                { coins: "5", type: "STORAGE" },
              ],
              product_id: fixtureIds.product,
              product_type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
            },
          ],
      summary: {
        charges: emptyCharges
          ? []
          : [
              { coins: "2.5", type: "PROCESSING" },
              { coins: "5", type: "STORAGE" },
            ],
      },
      unit_id: unit.id,
      until: "2026-08-01",
    }),
    uploadResponse: AppApiDatasetPostResponse.parse({
      dataset_id: fixtureIds.dataset,
      dataset_version: 1,
      task_id: fixtureIds.task,
    }),
    users: AppApiUserGetResponse.parse({
      count: 2,
      users: [{ username: subject }, { username: colleague }],
    }),
  };
};
