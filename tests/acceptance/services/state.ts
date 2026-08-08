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

export type ScenarioState = {
  accessFailure?: 403 | 503;
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
  /** How many times each upload task has been polled, so every upload advances on its own. */
  pollingIndexes: Map<string, number>;
  /** The profile this scenario was reset with; the identity provider reads it to issue roles. */
  profile: ScenarioProfile;
  productFailure: boolean;
  productCreationFailure?: 400 | 403 | 429 | 503;
  productCreationDelay?: number;
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
