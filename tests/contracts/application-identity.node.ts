import { expect, test } from "@playwright/test";

import {
  APPLICATION_ORGANISATION_STORAGE_KEY,
  clearLegacyScopeStorage,
  parsePersistedOrganisationId,
} from "../../src/application/applicationIdentity";
import { clearAccountScopedStorageOnLogout } from "../../src/application/logoutCleanup";
import { DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY } from "../../src/datasets/uploadBilling";
import { PROJECT_CREATION_RECOVERY_KEY } from "../../src/projects/projectCreation";
import { PROJECT_DELETION_RECOVERY_KEY } from "../../src/projects/projectDeletion";
import {
  parseRecentProjectIds,
  readRecentProjectIds,
  RECENT_PROJECTS_STORAGE_KEY,
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

  test("logging out clears what was remembered for the account and nothing else", () => {
    // Every key here was written because of who was logged in, so the session ending takes all of
    // them — including the work this account left in flight. What the browser remembers about
    // itself, rather than about the account, survives: a logout is not a factory reset.
    const local = new Map<string, string>([
      [APPLICATION_ORGANISATION_STORAGE_KEY, '{"version":1,"organisationId":"organisation-123"}'],
      ["data-manager-ui-current-project", "project"],
      ["data-manager-ui-selected-files", "files"],
      [RECENT_PROJECTS_STORAGE_KEY, '["project-one"]'],
      [PROJECT_DELETION_RECOVERY_KEY, '{"version":1}'],
      [DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY, '{"version":1,"unitId":"unit-1"}'],
      ["data-manager-ui-cookie-consent", "consent"],
      ["data-manager-ui-event-debug-mode", "debug"],
      ["mui-color-scheme-light", "light"],
    ]);
    const session = new Map<string, string>([
      [PROJECT_CREATION_RECOVERY_KEY, '{"version":2}'],
      ["unrelated-session-value", "kept"],
    ]);

    clearAccountScopedStorageOnLogout({
      local: { removeItem: (key) => void local.delete(key) },
      session: { removeItem: (key) => void session.delete(key) },
    });

    expect([...local.keys()]).toEqual([
      "data-manager-ui-cookie-consent",
      "data-manager-ui-event-debug-mode",
      "mui-color-scheme-light",
    ]);
    expect([...session.keys()]).toEqual(["unrelated-session-value"]);
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
