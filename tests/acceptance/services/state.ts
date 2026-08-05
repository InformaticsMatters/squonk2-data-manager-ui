import { createScenarioFixtures, type ScenarioProfile } from "./fixtures";

export type RequestRecord = {
  authorization: string | undefined;
  method: string;
  path: string;
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
  };
  scenarios.set(subject, state);
  return state;
};

export const getScenario = (subject: string) => scenarios.get(subject) ?? resetScenario(subject);
