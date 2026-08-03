import { AppApiEventStreamGetEventStreamVersionResponse } from "@/api/account-server/event-stream/zod";
import {
  AppApiOrganisationGetOrgResponse,
  AppApiOrganisationGetResponse,
} from "@/api/account-server/organisation/zod";
import { AppApiProductGetResponse } from "@/api/account-server/product/zod";
import { AppApiStateGetVersionResponse } from "@/api/account-server/state/zod";
import { AppApiUnitGetResponse } from "@/api/account-server/unit/zod";
import { AppApiVersionGetResponse } from "@/api/data-manager/accounting/zod";
import {
  AppApiDatasetGetResponse,
  AppApiDatasetPostResponse,
} from "@/api/data-manager/dataset/zod";
import { AppApiProjectGetResponse } from "@/api/data-manager/project/zod";
import { AppApiTaskGetTaskResponse } from "@/api/data-manager/task/zod";
import { AppApiTypeGetResponse } from "@/api/data-manager/type/zod";
import { AppApiUserGetResponse } from "@/api/data-manager/user/zod";

const created = "2026-01-02T03:04:05Z";

export const fixtureIds = {
  dataset: "dataset-11111111-1111-1111-1111-111111111111",
  organisation: "org-22222222-2222-2222-2222-222222222222",
  otherOrganisation: "org-66666666-6666-6666-6666-666666666666",
  product: "product-77777777-7777-7777-7777-777777777777",
  project: "project-33333333-3333-3333-3333-333333333333",
  task: "task-44444444-4444-4444-4444-444444444444",
  unit: "unit-55555555-5555-5555-5555-555555555555",
} as const;

export const binaryFixture = Buffer.from([0, 1, 2, 3, 254, 255]);

export const createScenarioFixtures = (subject: string) => {
  const colleague = `${subject}-observer`;
  const organisation = {
    caller_is_member: true,
    created,
    default_product_privacy: "DEFAULT_PRIVATE" as const,
    id: fixtureIds.organisation,
    name: "Acceptance Organisation",
    owner_id: subject,
    private: true,
    users: [{ id: subject }, { id: colleague }],
  };
  const otherOrganisation = {
    ...organisation,
    id: fixtureIds.otherOrganisation,
    name: "Partner Organisation",
  };

  return {
    accountServerVersion: AppApiStateGetVersionResponse.parse({ version: "4.7.0-acceptance" }),
    dataset: AppApiDatasetGetResponse.parse({
      count: 1,
      datasets: [
        {
          dataset_id: fixtureIds.dataset,
          editors: [subject],
          versions: [
            {
              file_name: "acceptance-dataset.sdf",
              labels: { scenario: ["deterministic"] },
              owner: subject,
              processing_stage: "DONE",
              projects: [fixtureIds.project],
              published: created,
              size: binaryFixture.length,
              source_ref: "acceptance-dataset.sdf",
              type: "chemical/x-mdl-sdfile",
              version: 1,
            },
          ],
        },
      ],
    }),
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
    organisation: AppApiOrganisationGetOrgResponse.parse(organisation),
    organisations: AppApiOrganisationGetResponse.parse({
      count: 2,
      organisations: [organisation, otherOrganisation],
    }),
    otherOrganisation: AppApiOrganisationGetOrgResponse.parse(otherOrganisation),
    projects: AppApiProjectGetResponse.parse({
      count: 1,
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
          project_id: fixtureIds.project,
          size: 0,
          unit_id: fixtureIds.unit,
        },
      ],
    }),
    products: AppApiProductGetResponse.parse({ count: 0, products: [] }),
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
        {
          count: 1,
          organisation,
          units: [
            {
              billing_day: 1,
              caller_is_member: true,
              created,
              default_product_privacy: "DEFAULT_PRIVATE",
              id: fixtureIds.unit,
              name: "Acceptance Unit",
              owner_id: subject,
              private: true,
              users: [{ id: subject }, { id: colleague }],
            },
          ],
        },
      ],
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
