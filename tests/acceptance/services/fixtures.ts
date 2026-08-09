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
  AppApiUnitGetUnitResponse,
  AppApiUnitPersonalGetResponse,
} from "@/api/account-server/unit/zod";
import { AppApiUserGetAccountResponse } from "@/api/account-server/user/zod";
import { AppApiVersionGetResponse } from "@/api/data-manager/accounting/zod";
import {
  AppApiApplicationGetApplicationResponse,
  AppApiApplicationGetResponse,
} from "@/api/data-manager/application/zod";
import {
  AppApiDatasetGetResponse,
  AppApiDatasetPostResponse,
} from "@/api/data-manager/dataset/zod";
import { AppApiInstanceGetResponse } from "@/api/data-manager/instance/zod";
import { AppApiJobGetJobResponse, AppApiJobGetResponse } from "@/api/data-manager/job/zod";
import { AppApiProjectGetResponse } from "@/api/data-manager/project/zod";
import { AppApiTaskGetResponse, AppApiTaskGetTaskResponse } from "@/api/data-manager/task/zod";
import { AppApiTypeGetResponse } from "@/api/data-manager/type/zod";
import {
  AppApiUserGetAccountResponse as AppApiDataManagerUserGetAccountResponse,
  AppApiUserGetResponse,
} from "@/api/data-manager/user/zod";
import {
  AppApiWorkflowGetResponse,
  AppApiWorkflowGetRunningResponse,
  AppApiWorkflowGetWorkflowResponse,
} from "@/api/data-manager/workflow/zod";

import { gzipSync } from "node:zlib";

const created = "2026-01-02T03:04:05Z";

export const fixtureIds = {
  createdOrganisation: "org-0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a",
  createdProduct: "product-0c0c0c0c-0c0c-4c0c-8c0c-0c0c0c0c0c0c",
  createdProject: "project-0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f",
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
  storageProduct: "product-7e7e7e7e-7e7e-4e7e-8e7e-7e7e7e7e7e7e",
  project: "project-33333333-3333-3333-3333-333333333333",
  /** A second entered project, used to prove Results cannot cross a project boundary. */
  screeningProject: "project-6b6b6b6b-6b6b-4b6b-8b6b-6b6b6b6b6b6b",
  screeningProduct: "product-6c6c6c6c-6c6c-4c6c-8c6c-6c6c6c6c6c6c",
  /** The subscription of the project another organisation owns, so that project can be entered. */
  partnerProduct: "product-6d6d6d6d-6d6d-4d6d-8d6d-6d6d6d6d6d6d",
  instance: "instance-1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a",
  screeningInstance: "instance-2b2b2b2b-2b2b-4b2b-8b2b-2b2b2b2b2b2b",
  resultTask: "task-3c3c3c3c-3c3c-4c3c-8c3c-3c3c3c3c3c3c",
  screeningResultTask: "task-4d4d4d4d-4d4d-4d4d-8d4d-4d4d4d4d4d4d",
  runningWorkflow: "r-workflow-5e5e5e5e-5e5e-4e5e-8e5e-5e5e5e5e5e5e",
  screeningRunningWorkflow: "r-workflow-6f6f6f6f-6f6f-4f6f-8f6f-6f6f6f6f6f6f",
  workflow: "workflow-7a7a7a7a-7a7a-4a7a-8a7a-7a7a7a7a7a7a",
  /** The executions a launch from the Run catalogue creates. */
  launchedInstance: "instance-8a8a8a8a-8a8a-4a8a-8a8a-8a8a8a8a8a8a",
  launchedRunningWorkflow: "r-workflow-9b9b9b9b-9b9b-4b9b-8b9b-9b9b9b9b9b9b",
  sharedProjectOne: "project-88888888-8888-4888-8888-888888888888",
  sharedProjectTwo: "project-99999999-9999-4999-8999-999999999999",
  partnerProject: "project-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  task: "task-44444444-4444-4444-4444-444444444444",
  unit: "unit-55555555-5555-5555-5555-555555555555",
  otherUnit: "unit-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  /** Readable through their own resource, but absent from the caller's organisation and unit index. */
  unlistedOrganisation: "org-1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c",
  unlistedUnit: "unit-1f1f1f1f-1f1f-4f1f-8f1f-1f1f1f1f1f1f",
  unlistedProduct: "product-2f2f2f2f-2f2f-4f2f-8f2f-2f2f2f2f2f2f",
} as const;

export const datasetContentFixtures = {
  1: gzipSync(Buffer.from("acceptance dataset version 1\n")),
  2: gzipSync(Buffer.from("acceptance dataset version 2\n")),
} as const;

export const scenarioProfiles = [
  "default",
  "empty-charges",
  "empty-products",
  "evaluator",
  "no-access",
  "no-personal-unit",
  "platform-admin",
  "read-only",
] as const;
export type ScenarioProfile = (typeof scenarioProfiles)[number];
export const isScenarioProfile = (value: string): value is ScenarioProfile =>
  scenarioProfiles.includes(value as ScenarioProfile);

/** One file a project holds, in the shape the generated `FilePathFile` resource declares. */
export type FixtureProjectFile = {
  file_id?: string;
  file_name: string;
  immutable?: boolean;
  mime_type?: string;
  owner: string;
  /** Absolute path of the directory holding it. */
  path: string;
  size: number;
};

/** One project's filesystem, held flat so a listing is derived rather than nested and copied. */
export type FixtureProjectFileSystem = { directories: string[]; files: FixtureProjectFile[] };

const createProjectFileSystems = (
  subject: string,
): Record<string, FixtureProjectFileSystem | undefined> => ({
  [fixtureIds.project]: {
    directories: ["/inputs", "/inputs/ligands"],
    files: [
      { file_name: "notes.txt", mime_type: "text/plain", owner: subject, path: "/", size: 12 },
      {
        file_id: "file-11111111-1111-4111-8111-111111111111",
        file_name: "acceptance-dataset-v2.sdf",
        immutable: true,
        mime_type: "chemical/x-mdl-sdfile",
        owner: subject,
        path: "/",
        size: 2048,
      },
      {
        file_name: "poses.sdf",
        mime_type: "chemical/x-mdl-sdfile",
        owner: subject,
        path: "/inputs",
        size: 512,
      },
      {
        file_name: "poses.schema.json",
        mime_type: "application/schema+json",
        owner: subject,
        path: "/inputs",
        size: 64,
      },
    ],
  },
  [fixtureIds.screeningProject]: {
    directories: [],
    files: [
      {
        file_name: "screening-library.sdf",
        mime_type: "chemical/x-mdl-sdfile",
        owner: subject,
        path: "/",
        size: 1024,
      },
    ],
  },
});

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
  // Readable through their own resource while the caller's index never lists them, which is what a
  // creator or platform administrator following a direct link sees.
  const unlistedOrganisation = {
    ...organisation,
    caller_is_member: false,
    id: fixtureIds.unlistedOrganisation,
    name: "Unlisted Organisation",
  };
  const unlistedUnit = {
    ...unit,
    caller_is_member: false,
    id: fixtureIds.unlistedUnit,
    name: "Unlisted Unit",
    users: [],
  };
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
  // Project membership follows the same profiles: `read-only` observes the project it can read and
  // `platform-admin` holds no project role at all, so platform privilege is the only thing on offer.
  const projectOwner = readOnly || platformAdmin ? colleague : subject;
  const projectObservers = readOnly ? [subject] : platformAdmin ? [] : [colleague];
  const projectRoles = {
    administrators: [projectOwner],
    creator: projectOwner,
    editors: [projectOwner],
    observers: projectObservers,
  };
  // The second project deliberately grants the caller less than the first one does. Two projects
  // the same caller holds different authority in are what makes capability presentation provably
  // a fact of the project a result belongs to rather than of the caller alone.
  const screeningRoles = {
    administrators: [colleague],
    creator: colleague,
    editors: [colleague],
    observers: [subject],
  };
  const noAccess = profile === "no-access";
  const hasPersonalUnit = profile !== "no-personal-unit" && !noAccess;
  const projectTierProduct = {
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
  };
  // The generated products union lists the storage shape first, so a project-tier product validates
  // against that member and parses back without its instance accounting. The fixture is checked by
  // the generated schema but served exactly as the Account Server sends it.
  AppApiProductGetResponse.parse({ count: 1, products: [projectTierProduct] });
  const products = { count: 1, products: [projectTierProduct] };
  // The second project's subscription answers for itself without joining the caller's product
  // index, which keeps the Subscriptions task exactly as it was while a second project can still
  // resolve its own ancestry.
  const screeningProduct = {
    ...projectTierProduct,
    claim: { id: fixtureIds.screeningProject, name: "Screening Project" },
    product: { ...projectTierProduct.product, id: fixtureIds.screeningProduct },
    unit: otherUnit,
  };
  // The project another organisation owns answers for its own ancestry the same way, so a link
  // followed into it resolves the organisation and unit the project itself declares.
  const partnerProduct = {
    ...projectTierProduct,
    claim: { id: fixtureIds.partnerProject, name: "Partner Project" },
    organisation: otherOrganisation,
    product: { ...projectTierProduct.product, id: fixtureIds.partnerProduct },
  };
  const unlistedProjectProduct = {
    ...projectTierProduct,
    claim: undefined,
    organisation: unlistedOrganisation,
    product: { ...projectTierProduct.product, id: fixtureIds.unlistedProduct },
    unit: unlistedUnit,
  };
  // Only the Acceptance Unit is subscribed for datasets. The Screening Unit is a unit the caller is
  // just as much a member of and cannot upload to, which is what makes the missing-subscription
  // recovery a fact of the chosen unit rather than of the caller.
  const datasetStorageProduct = {
    claimable: false,
    coins: {
      allowance: 1000,
      allowance_multiplier: 1,
      at_limit: false,
      billing_day: 1,
      billing_prediction: 0,
      billing_prediction_storage_contribution: 0,
      current_burn_rate: 0,
      limit: 1000,
      overspend_multiplier: 1,
      remaining_days: 30,
      used: 0,
    },
    organisation,
    product: {
      created,
      id: fixtureIds.storageProduct,
      name: "Dataset Storage",
      type: "DATA_MANAGER_STORAGE_SUBSCRIPTION",
    },
    storage: {
      coins: { unit_cost: 1, used: 0 },
      size: { current: "0 B", peak: "0 B", unit_size: "1 GB", units_used: 0 },
    },
    unit,
  };
  const unitProducts: Record<string, { count: number; products: unknown[] }> = {
    [fixtureIds.unit]: AppApiProductGetResponse.parse({
      count: 1,
      products: [datasetStorageProduct],
    }),
    [fixtureIds.otherUnit]: AppApiProductGetResponse.parse({ count: 0, products: [] }),
    [fixtureIds.personalUnit]: AppApiProductGetResponse.parse({ count: 0, products: [] }),
  };

  return {
    accountServerVersion: AppApiStateGetVersionResponse.parse({ version: "4.7.0-acceptance" }),
    /**
     * The files each project holds, as a mutable tree the fixture services change in place, so a
     * created directory, an upload, a rename, and a deletion are all observable in the next listing
     * exactly as the Data Manager makes them.
     */
    projectFiles: createProjectFileSystems(subject),
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
      /**
       * A refusal this client has no rule for, whose only account of itself is the sentence the
       * Data Manager wrote. Reading as prose rather than as a slug is the point of it.
       */
      badRequest: { error: "fixture-rejected: the file type is not supported by this project" },
      forbidden: { error: "fixture-forbidden" },
      rateLimited: { error: "fixture-rate-limited" },
      serverError: { error: "fixture-server-error" },
    },
    callerAccount: AppApiUserGetAccountResponse.parse({
      account_server_roles: platformAdmin ? ["admin", "user"] : ["user"],
      caller_has_admin_privilege: platformAdmin,
      user: { id: subject },
    }),
    dataManagerAccount: AppApiDataManagerUserGetAccountResponse.parse({
      caller_has_admin_privilege: platformAdmin,
      data_manager_roles: platformAdmin
        ? ["data-manager-user", "data-manager-admin"]
        : ["data-manager-user"],
      user: { private: false, username: subject },
    }),
    defaultOrganisation: AppApiOrganisationGetDefaultResponse.parse(defaultOrganisation),
    defaultOrganisationDetail: defaultOrganisation,
    personalUnit: AppApiUnitPersonalGetResponse.parse(personalUnit),
    subject,
    organisation: AppApiOrganisationGetOrgResponse.parse(organisation),
    organisations: AppApiOrganisationGetResponse.parse({
      count: noAccess ? 0 : 3,
      organisations: noAccess ? [] : [organisation, otherOrganisation, defaultOrganisation],
    }),
    unlistedOrganisation: AppApiOrganisationGetOrgResponse.parse(unlistedOrganisation),
    unlistedUnit: AppApiUnitGetUnitResponse.parse(unlistedUnit),
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
      count: 5,
      projects: [
        {
          ...projectRoles,
          created,
          files: [],
          name: "Acceptance Project",
          organisation_id: fixtureIds.organisation,
          private: true,
          product_id: fixtureIds.product,
          project_id: fixtureIds.project,
          size: 0,
          unit_id: fixtureIds.unit,
        },
        {
          ...screeningRoles,
          created,
          files: [],
          name: "Screening Project",
          organisation_id: fixtureIds.organisation,
          private: true,
          product_id: fixtureIds.screeningProduct,
          project_id: fixtureIds.screeningProject,
          size: 0,
          unit_id: fixtureIds.otherUnit,
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
          product_id: fixtureIds.partnerProduct,
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
    partnerProduct,
    screeningProduct,
    storageProduct: datasetStorageProduct,
    unlistedProjectProduct,
    unitProducts,
    // Results of work run in each project. Every one names the project it belongs to, so a
    // response that ignored a project argument would be recognisable rather than believable.
    instances: AppApiInstanceGetResponse.parse({
      count: 2,
      instances: [
        {
          application_id: "acceptance-application",
          application_type: "JOB",
          application_version: "1.0.0",
          archived: false,
          id: fixtureIds.instance,
          job_collection: "acceptance",
          job_id: 1,
          job_job: "acceptance-job",
          job_name: "Acceptance Job",
          job_version: "1.0.0",
          launched: created,
          name: "Acceptance Instance",
          owner: subject,
          phase: "COMPLETED",
          project_id: fixtureIds.project,
          run_time: "0:01:00",
          started: created,
          stopped: "2026-01-02T03:05:05Z",
        },
        {
          application_id: "screening-application",
          application_type: "APPLICATION",
          application_version: "1.0.0",
          archived: false,
          id: fixtureIds.screeningInstance,
          launched: created,
          name: "Screening Instance",
          owner: subject,
          phase: "COMPLETED",
          project_id: fixtureIds.screeningProject,
          run_time: "0:02:00",
          started: created,
          stopped: "2026-01-02T03:06:05Z",
        },
      ],
    }),
    // The Run catalogue. Applications and workflow definitions are catalogues the Data Manager
    // does not scope by project; jobs are, so they answer for the project they were asked about.
    applications: AppApiApplicationGetResponse.parse({
      count: 1,
      applications: [
        {
          application_id: "acceptance-application",
          group: "notebooks",
          kind: "AcceptanceNotebook",
        },
      ],
    }),
    applicationDetail: AppApiApplicationGetApplicationResponse.parse({
      cost: "0",
      group: "notebooks",
      id: "acceptance-application",
      instances: [],
      kind: "AcceptanceNotebook",
      template: JSON.stringify({ properties: {}, type: "object" }),
      versions: ["1.0.0"],
    }),
    jobs: AppApiJobGetResponse.parse({
      count: 3,
      jobs: [
        {
          collection: "acceptance",
          description: "Docks a library against a protein",
          disabled: false,
          id: 1,
          image_type: "SIMPLE",
          job: "acceptance-job",
          keywords: ["docking"],
          name: "Acceptance Job",
          required_assets: [],
          version: "1.0.0",
        },
        {
          collection: "acceptance",
          description: "Docks a library against a protein",
          disabled: false,
          id: 2,
          image_type: "SIMPLE",
          job: "acceptance-job",
          keywords: ["docking"],
          name: "Acceptance Job",
          required_assets: [],
          version: "2.0.0",
        },
        {
          collection: "acceptance",
          disabled: true,
          disabled_reason: "This job's container image is missing.",
          id: 3,
          image_type: "SIMPLE",
          job: "unavailable-job",
          name: "Unavailable Job",
          required_assets: [],
          version: "1.0.0",
        },
      ],
    }),
    jobDetails: Object.fromEntries(
      [
        { id: 1, disabled: false, job: "acceptance-job", name: "Acceptance Job", version: "1.0.0" },
        { id: 2, disabled: false, job: "acceptance-job", name: "Acceptance Job", version: "2.0.0" },
        {
          id: 3,
          disabled: true,
          job: "unavailable-job",
          name: "Unavailable Job",
          version: "1.0.0",
        },
      ].map((detail) => [
        detail.id,
        AppApiJobGetJobResponse.parse({
          application: { application_id: "acceptance-application", kind: "DataManagerJobOperator" },
          collection: "acceptance",
          command: "acceptance",
          command_encoding: "JINJA2_3_0",
          disabled: detail.disabled,
          exchange_rate: "1",
          id: detail.id,
          image_name: "acceptance/job",
          image_project_directory: "/data",
          image_tag: detail.version,
          job: detail.job,
          name: detail.name,
          required_assets: [],
          version: detail.version,
        }),
      ]),
    ),
    workflows: AppApiWorkflowGetResponse.parse({
      count: 1,
      workflows: [
        {
          id: fixtureIds.workflow,
          name: "acceptance-workflow",
          scope: "GLOBAL",
          validated: true,
          version: "1.0.0",
          workflow_description: "Screens a library against a target",
          workflow_name: "Acceptance Workflow Definition",
        },
      ],
    }),
    workflowDetail: AppApiWorkflowGetWorkflowResponse.parse({
      created,
      id: fixtureIds.workflow,
      name: "acceptance-workflow",
      scope: "GLOBAL",
      validated: true,
      variables: {},
      version: "1.0.0",
      workflow_description: "Screens a library against a target",
      workflow_name: "Acceptance Workflow Definition",
    }),
    resultTasks: {
      [fixtureIds.project]: AppApiTaskGetResponse.parse({
        count: 1,
        tasks: [
          {
            created: "2026-01-02T02:04:05Z",
            done: true,
            exit_code: 0,
            id: fixtureIds.resultTask,
            processing_stage: "DONE",
            purpose: "DATASET",
            purpose_id: fixtureIds.dataset,
          },
        ],
      }),
      [fixtureIds.screeningProject]: AppApiTaskGetResponse.parse({
        count: 1,
        tasks: [
          {
            created: "2026-01-02T02:04:05Z",
            done: true,
            exit_code: 0,
            id: fixtureIds.screeningResultTask,
            processing_stage: "DONE",
            purpose: "FILE",
            purpose_id: fixtureIds.dataset,
          },
        ],
      }),
    },
    runningWorkflows: AppApiWorkflowGetRunningResponse.parse({
      count: 2,
      running_workflows: [
        {
          error_num: 0,
          id: fixtureIds.runningWorkflow,
          name: "Acceptance Workflow",
          project: { id: fixtureIds.project, name: "Acceptance Project" },
          started: "2026-01-02T04:04:05Z",
          status: "SUCCESS",
          stopped: "2026-01-02T04:14:05Z",
          workflow: { id: fixtureIds.workflow, name: "acceptance-workflow", version: "1.0.0" },
        },
        {
          error_num: 0,
          id: fixtureIds.screeningRunningWorkflow,
          name: "Screening Workflow",
          project: { id: fixtureIds.screeningProject, name: "Screening Project" },
          started: "2026-01-02T04:04:05Z",
          status: "SUCCESS",
          stopped: "2026-01-02T04:24:05Z",
          workflow: { id: fixtureIds.workflow, name: "acceptance-workflow", version: "1.0.0" },
        },
      ],
    }),
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
        ...(noAccess ? [] : [{ count: 2, organisation, units: [unit, otherUnit] }]),
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
