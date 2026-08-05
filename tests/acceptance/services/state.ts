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
  chargeFailure?: 403 | 429 | 503;
  datasetContentFailure?: 403 | 429 | 503;
  datasetFailure?: 429 | 503;
  datasetMutationFailure?: 403 | 503;
  deletionPollingIndexes: Map<string, number>;
  deletionTaskVersions: Map<string, number>;
  deletionExitCode?: number;
  fixtures: ReturnType<typeof createScenarioFixtures>;
  pollingIndex: number;
  productFailure: boolean;
  projectFailure?: number;
  projectMutationFailure?: 403 | 503;
  requests: RequestRecord[];
  /**
   * Results read failures in effect. Each is optionally narrowed to one collection path, e.g.
   * `/instance`, so collections can be made to fail differently and at the same time.
   */
  resultsFailures: { collection?: string; status: 403 | 503 }[];
  addressedReadFailure?: 403 | 503;
  semanticsFailure?: 503;
  taskFailure?: 503;
  unitsReadFailure?: 503;
  upload?: { body: Buffer; contentType: string };
};

const scenarios = new Map<string, ScenarioState>();

export const resetScenario = (subject: string, profile: ScenarioProfile = "default") => {
  const state: ScenarioState = {
    fixtures: createScenarioFixtures(subject, profile),
    deletionPollingIndexes: new Map(),
    deletionTaskVersions: new Map(),
    pollingIndex: 0,
    productFailure: false,
    requests: [],
    resultsFailures: [],
  };
  scenarios.set(subject, state);
  return state;
};

export const getScenario = (subject: string) => scenarios.get(subject) ?? resetScenario(subject);
