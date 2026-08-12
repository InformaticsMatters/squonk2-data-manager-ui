import { type ProductDmProjectTier, type ProductDmStorage } from "@/api/account-server";
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

/**
 * How a result task accounts for itself. `failed` finished with a non-zero exit code; `rejected`
 * finished with a zero exit code but recorded a domain failure, which is the case an exit code
 * alone would read as success.
 */
export type ResultTaskStage = "done" | "failed" | "rejected" | "running";

/**
 * How a running workflow accounts for itself. `rejected` finished with a `SUCCESS` status but
 * recorded an error, which is the case a status alone would read as a completed run; `stopped` is
 * the outcome a caller who stopped it produced, which is neither a success nor a failure; and
 * `unrecognised` reports a status this client has no rule for, which establishes nothing at all.
 */
export type RunningWorkflowStage =
  | "done"
  | "failed"
  | "rejected"
  | "running"
  | "stopped"
  | "unrecognised";

/**
 * How an instance accounts for itself. `rejected` finished with a successful phase but recorded an
 * error message, which is the case a phase alone would read as completed work; `stalled` is a phase
 * the Data Manager reports for an instance the cluster could not start, which is neither running nor
 * finished; and `unrecognised` reports the Data Manager's own `UNKNOWN` phase, which establishes
 * nothing at all.
 */
export type ResultInstanceStage =
  | "done"
  | "failed"
  | "rejected"
  | "running"
  | "stalled"
  | "unrecognised";

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
  /** The dataset storage subscription a Subscriptions command created. */
  createdStorageProduct?: ProductDmStorage;
  createdProject?: ProjectDetail;
  datasetContentFailure?: 403 | 429 | 503;
  datasetFailure?: 429 | 503;
  datasetMutationFailure?: 403 | 503;
  /** A refused or failing directory listing, so a cleared listing and a stale one are told apart. */
  filesFailure?: 403 | 503;
  /** A refused or failing file change, so a rejection and a transport failure are told apart. */
  fileMutationFailure?: 403 | 503;
  /**
   * A refused or failing read of one file's bytes, so a file a viewer may not read and one whose
   * content merely could not be delivered are told apart from a file the project does not hold.
   */
  fileContentFailure?: 403 | 429 | 503;
  deletionPollingIndexes: Map<string, number>;
  deletionTaskVersions: Map<string, number>;
  deletionExitCode?: number;
  fixtures: ReturnType<typeof createScenarioFixtures>;
  /** The instances a caller has deleted; the project that owned them no longer lists them. */
  deletedInstances: string[];
  /**
   * A refused, missing, or failing read of one addressed instance, so an instance the caller may
   * not see and one whose progress merely could not be read are told apart.
   */
  instanceFailure?: 403 | 404 | 503;
  /** A refused or failing terminate, delete, or archive, so a rejection preserves the caller's scope. */
  instanceCommandFailure?: 403 | 503;
  /** The stage every instance reports, so each representative lifecycle is reachable. */
  instanceStage: ResultInstanceStage;
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
  /**
   * A refused or failing subscription command, so an authoritative rejection and a transport
   * failure are told apart, and neither is confused with the project workflow's own cleanup.
   */
  subscriptionMutationFailure?: 403 | 503;
  /** The subscriptions a caller deleted; no later read reports them. */
  deletedSubscriptions: string[];
  /** What each adjusted subscription was changed to, which every later read of it reports. */
  subscriptionAdjustments: Map<string, { allowance?: number; limit?: number; name?: string }>;
  productCreationDelay?: number;
  /**
   * A failing read of the project collection, which is the index every cross-organisation choice of
   * a project rests on. Distinct from a single project's own read failing.
   */
  projectCollectionFailure?: 403 | 503;
  projectCreationFailure?: 400 | 403 | 429 | 503;
  projectCreationResponseDelay?: number;
  /** A refused or failing project deletion request, so no task is ever issued for it. */
  projectDeletionFailure?: 400 | 403 | 429 | 503;
  /** A terminal exit code a project-deletion task reports instead of success. */
  projectDeletionExitCode?: number;
  /**
   * How many times each project-deletion task has been polled, so a deletion advances on its own
   * and is never confused with an upload, an attachment, or a dataset-version deletion.
   */
  projectDeletionPollingIndexes: Map<string, number>;
  /**
   * A refused, missing, or failing read of a project-deletion task, so a progress read that merely
   * could not be made is told apart from one this client is not allowed to interpret.
   */
  projectDeletionTaskFailure?: 403 | 404 | 503;
  /** The project each issued deletion task is removing, which it removes once it settles. */
  projectDeletionTasks: Map<string, string>;
  /** The projects a settled deletion removed; no later read reports them. */
  deletedProjects: string[];
  projectFailure?: number;
  projectMutationFailure?: 403 | 503;
  requests: RequestRecord[];
  /**
   * Results read failures in effect. Each is optionally narrowed to one collection path, e.g.
   * `/instance`, so collections can be made to fail differently and at the same time.
   */
  resultsFailures: { collection?: string; status: 403 | 503 }[];
  /** The result tasks a caller has deleted; the project that owned them no longer lists them. */
  deletedResultTasks: string[];
  /**
   * A refused, missing, or failing read of one addressed result task, so a task the caller may not
   * see and one whose progress merely could not be read are told apart.
   */
  resultTaskFailure?: 403 | 404 | 503;
  /** A refused or failing result-task deletion, so a rejection preserves the caller's scope. */
  resultTaskDeletionFailure?: 403 | 503;
  /** The stage every result task reports, so each representative lifecycle is reachable. */
  resultTaskStage: ResultTaskStage;
  /** The running workflows a caller has deleted; the project that owned them no longer lists them. */
  deletedRunningWorkflows: string[];
  /**
   * A refused, missing, or failing read of one addressed running workflow, so a workflow the
   * caller may not see and one whose progress merely could not be read are told apart.
   */
  runningWorkflowFailure?: 403 | 404 | 503;
  /** A refused or failing read of one addressed workflow's steps, distinct from the workflow's. */
  runningWorkflowStepsFailure?: 403 | 503;
  /** A refused or failing stop or delete, so a rejection preserves the caller's scope. */
  runningWorkflowCommandFailure?: 403 | 503;
  /** The stage every running workflow reports, so each representative lifecycle is reachable. */
  runningWorkflowStage: RunningWorkflowStage;
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
  /**
   * The uploads that named an existing dataset, by the task each was given. A version only exists
   * once its task has settled successfully, so the fixture adds it then rather than at acceptance.
   */
  versionUploadTasks: Map<string, { datasetId: string; fileName: string; type: string }>;
};

const scenarios = new Map<string, ScenarioState>();

export const resetScenario = (subject: string, profile: ScenarioProfile = "default") => {
  const state: ScenarioState = {
    attachments: [],
    attachmentPollingIndexes: new Map(),
    attachmentTasks: new Map(),
    deletedInstances: [],
    deletedProjects: [],
    deletedResultTasks: [],
    deletedRunningWorkflows: [],
    deletedSubscriptions: [],
    projectDeletionPollingIndexes: new Map(),
    projectDeletionTasks: new Map(),
    subscriptionAdjustments: new Map(),
    fixtures: createScenarioFixtures(subject, profile),
    instanceStage: "done",
    deletionPollingIndexes: new Map(),
    deletionTaskVersions: new Map(),
    pollingIndexes: new Map(),
    productFailure: false,
    profile,
    requests: [],
    resultsFailures: [],
    resultTaskStage: "done",
    runFailures: [],
    runningWorkflowStage: "done",
    uploadTaskIds: [],
    versionUploadTasks: new Map(),
  };
  scenarios.set(subject, state);
  return state;
};

export const getScenario = (subject: string) => scenarios.get(subject) ?? resetScenario(subject);
