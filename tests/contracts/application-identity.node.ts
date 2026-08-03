import { expect, test } from "@playwright/test";

import {
  APPLICATION_ORGANISATION_STORAGE_KEY,
  clearLegacyScopeStorage,
  parsePersistedOrganisationId,
} from "../../src/application/applicationIdentity";
import {
  parseRecentProjectIds,
  readRecentProjectIds,
  recordRecentProject,
} from "../../src/projects/recentProjects";

test.describe("application identity persistence", () => {
  test("accepts only a persisted organisation ID payload", () => {
    expect(parsePersistedOrganisationId({ organisationId: "organisation-123", version: 1 })).toBe(
      "organisation-123",
    );
    expect(parsePersistedOrganisationId({ organisationId: "", version: 1 })).toBeUndefined();
    expect(
      parsePersistedOrganisationId({ organisationId: "organisation-123", version: 2 }),
    ).toBeUndefined();
    expect(
      parsePersistedOrganisationId({ id: "organisation-123", name: "Stored object" }),
    ).toBeUndefined();
    expect(parsePersistedOrganisationId("organisation-123")).toBeUndefined();
  });

  test("removes legacy scope while retaining identity and unrelated preferences", () => {
    const values = new Map<string, string>([
      [APPLICATION_ORGANISATION_STORAGE_KEY, '{"version":1,"organisationId":"organisation-123"}'],
      ["data-manager-ui-current-project", "project"],
      ["data-manager-ui-selected-files", "files"],
      ["data-manager-ui-cookie-consent", "consent"],
      ["data-manager-ui-event-debug-mode", "debug"],
      ["unrelated", "preference"],
    ]);

    clearLegacyScopeStorage({ removeItem: (key) => values.delete(key) });

    expect([...values]).toEqual([
      [APPLICATION_ORGANISATION_STORAGE_KEY, '{"version":1,"organisationId":"organisation-123"}'],
      ["data-manager-ui-cookie-consent", "consent"],
      ["data-manager-ui-event-debug-mode", "debug"],
      ["unrelated", "preference"],
    ]);
  });
});

test("recent projects are ordered direct-link history rather than active scope", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  recordRecentProject(storage, "project-one");
  recordRecentProject(storage, "project-two");
  recordRecentProject(storage, "project-one");
  recordRecentProject(storage, "project-three");
  recordRecentProject(storage, "project-four");

  expect(readRecentProjectIds(storage)).toEqual(["project-four", "project-three", "project-one"]);
  expect(parseRecentProjectIds(["project-one", 2, "project-one", "project-two"])).toEqual([
    "project-one",
    "project-two",
  ]);
});
