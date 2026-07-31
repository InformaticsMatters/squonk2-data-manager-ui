import { createScenarioFixtures } from "./fixtures";

export type RequestRecord = {
  authorization: string | undefined;
  method: string;
  path: string;
  subject: string;
};

export type ScenarioState = {
  fixtures: ReturnType<typeof createScenarioFixtures>;
  pollingIndex: number;
  requests: RequestRecord[];
  upload?: { body: Buffer; contentType: string };
};

const scenarios = new Map<string, ScenarioState>();

export const resetScenario = (subject: string) => {
  const state: ScenarioState = {
    fixtures: createScenarioFixtures(subject),
    pollingIndex: 0,
    requests: [],
  };
  scenarios.set(subject, state);
  return state;
};

export const getScenario = (subject: string) => scenarios.get(subject) ?? resetScenario(subject);
