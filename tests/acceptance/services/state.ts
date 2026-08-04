import { createScenarioFixtures, type ScenarioProfile } from "./fixtures";

export type RequestRecord = {
  authorization: string | undefined;
  method: string;
  path: string;
  subject: string;
};

export type ScenarioState = {
  datasetContentFailure?: 429 | 503;
  datasetFailure?: 429 | 503;
  datasetMutationFailure?: 403 | 503;
  deletionExitCode?: number;
  fixtures: ReturnType<typeof createScenarioFixtures>;
  pollingIndex: number;
  pendingDeletionVersion?: number;
  productFailure: boolean;
  projectFailure?: number;
  requests: RequestRecord[];
  taskFailure?: 503;
  upload?: { body: Buffer; contentType: string };
};

const scenarios = new Map<string, ScenarioState>();

export const resetScenario = (subject: string, profile: ScenarioProfile = "default") => {
  const state: ScenarioState = {
    fixtures: createScenarioFixtures(subject, profile),
    pollingIndex: 0,
    productFailure: false,
    requests: [],
  };
  scenarios.set(subject, state);
  return state;
};

export const getScenario = (subject: string) => scenarios.get(subject) ?? resetScenario(subject);
