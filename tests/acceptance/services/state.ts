import { type ProductDmProjectTier } from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { createScenarioFixtures, type ScenarioProfile } from "./fixtures";

export type RequestRecord = {
  authorization: string | undefined;
  method: string;
  path: string;
  /** The request's query string, including its leading `?` when it has one. */
  query: string;
  subject: string;
};

/** One attachment request the Data Manager received, in the fields the generated body carries. */
export type AttachmentRecord = {
  as_type: string;
  compress: boolean;
  dataset_id: string;
  dataset_version: number;
  immutable: boolean;
  path: string;
  project_id: string;
};

/** The work one accepted attachment task will do to a project once it settles. */
export type AttachmentTaskRecord = AttachmentRecord & { fileId: string; fileName: string };

export type ScenarioState = {
  accessFailure?: 403 | 503;
  /**
   * A refused or failing attachment request, so a rejection, a transport failure, and a refusal
   * this client has no rule for are each told apart.
   */
  attachFailure?: 400 | 403 | 503;
  /** A terminal exit code an attachment task reports instead of success. */
  attachExitCode?: number;
  /** Every attachment request received, so the options one carried can be stated exactly. */
  attachments: AttachmentRecord[];
  /** How many times each attachment task has been polled, so every attachment advances on its own. */
  attachmentPollingIndexes: Map<string, number>;
  /** The attachments awaiting their task, which only reach the project once that task settles. */
  attachmentTasks: Map<string, AttachmentTaskRecord>;
  /** The caller's own Data Manager account read, whose failure leaves project facts unconfirmed. */
  callerAccountFailure?: 503;
  chargeFailure?: 403 | 429 | 503;
  cleanupFailure?: 403 | 503;
  createdProduct?: ProductDmProjectTier;
  createdProject?: ProjectDetail;
  datasetContentFailure?: 403 | 429 | 503;
  datasetFailure?: 429 | 503;
  datasetMutationFailure?: 403 | 503;
  /** A refused or failing directory listing, so a cleared listing and a stale one are told apart. */
  filesFailure?: 403 | 503;
  /** A refused or failing file change, so a rejection and a transport failure are told apart. */
  fileMutationFailure?: 403 | 503;
  deletionPollingIndexes: Map<string, number>;
  deletionTaskVersions: Map<string, number>;
  deletionExitCode?: number;
  fixtures: ReturnType<typeof createScenarioFixtures>;
  /**
   * A refused, missing, rate-limited, or failing user-inventory read, so a report that is answered
   * authoritatively and one that merely could not be refreshed are told apart.
   */
  inventoryFailure?: 403 | 404 | 429 | 503;
  /** How many times each upload task has been polled, so every upload advances on its own. */
  pollingIndexes: Map<string, number>;
  /** The profile this scenario was reset with; the identity provider reads it to issue roles. */
  profile: ScenarioProfile;
  productFailure: boolean;
  productCreationFailure?: 400 | 403 | 429 | 503;
  productCreationDelay?: number;
  /**
   * A failing read of the project collection, which is the index every cross-organisation choice of
   * a project rests on. Distinct from a single project's own read failing.
   */
  projectCollectionFailure?: 403 | 503;
  projectCreationFailure?: 400 | 403 | 429 | 503;
  projectCreationResponseDelay?: number;
  projectFailure?: number;
  projectMutationFailure?: 403 | 503;
  requests: RequestRecord[];
  /**
   * Results read failures in effect. Each is optionally narrowed to one collection path, e.g.
   * `/instance`, so collections can be made to fail differently and at the same time.
   */
  resultsFailures: { collection?: string; status: 403 | 503 }[];
  /**
   * Run catalogue read failures in effect, each optionally narrowed to one catalogue path, e.g.
   * `/application`, so catalogues can be made to fail differently and at the same time.
   */
  runFailures: { collection?: string; status: 403 | 503 }[];
  /** A launch the Data Manager refuses or cannot complete. */
  launchFailure?: 403 | 503;
  addressedReadFailure?: 403 | 503;
  semanticsFailure?: 503;
  taskFailure?: 503;
  unitsReadFailure?: 503;
  upload?: { body: Buffer; contentType: string };
  /** A terminal exit code the dataset upload task reports instead of success. */
  uploadExitCode?: number;
  uploadFailure?: 403 | 503;
  /**
   * The task each accepted upload was given. The Data Manager issues a new one per upload, so a
   * retried file is answered by a task that has not already settled.
   */
  uploadTaskIds: string[];
};

const scenarios = new Map<string, ScenarioState>();

export const resetScenario = (subject: string, profile: ScenarioProfile = "default") => {
  const state: ScenarioState = {
    attachments: [],
    attachmentPollingIndexes: new Map(),
    attachmentTasks: new Map(),
    fixtures: createScenarioFixtures(subject, profile),
    deletionPollingIndexes: new Map(),
    deletionTaskVersions: new Map(),
    pollingIndexes: new Map(),
    productFailure: false,
    profile,
    requests: [],
    resultsFailures: [],
    runFailures: [],
    uploadTaskIds: [],
  };
  scenarios.set(subject, state);
  return state;
};

export const getScenario = (subject: string) => scenarios.get(subject) ?? resetScenario(subject);
