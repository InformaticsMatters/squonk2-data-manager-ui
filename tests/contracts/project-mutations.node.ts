import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { classifyProjectCommandFailure } from "../../src/projects/failures";
import {
  projectOutcomeMessage,
  projectRoles,
  resolveProjectMemberChange,
  resolveProjectPrivacyChange,
} from "../../src/projects/projectMutations";

const colleague = "colleague@example.org";
const administrator = "administrator@example.org";
const projectId = "project-33333333-3333-4333-8333-333333333333";
const rejection = (status: number) => new Response(null, { status });

test.describe("Project membership input shaping", () => {
  test("every managed role is shaped by the same resolver", () => {
    expect(projectRoles).toEqual(["administrator", "editor", "observer"]);
  });

  for (const role of projectRoles) {
    test(`one added ${role} is the change that is sent`, () => {
      expect(resolveProjectMemberChange(role, [administrator], [administrator, colleague])).toEqual(
        { kind: "add", role, username: colleague },
      );
    });

    test(`one removed ${role} is the change that is sent`, () => {
      expect(resolveProjectMemberChange(role, [administrator, colleague], [administrator])).toEqual(
        { kind: "remove", role, username: colleague },
      );
    });
  }

  test("surrounding whitespace never creates a second membership for the same user", () => {
    expect(
      resolveProjectMemberChange("editor", [administrator], [administrator, ` ${colleague} `]),
    ).toEqual({ kind: "add", role: "editor", username: colleague });
    expect(
      resolveProjectMemberChange("editor", [administrator, colleague], [administrator, colleague]),
    ).toEqual({ kind: "none", reason: "Nothing about this project's editors was changed." });
  });

  test("a blank username is not a user, so nothing is sent", () => {
    expect(resolveProjectMemberChange("observer", [administrator], [administrator, "   "])).toEqual(
      { kind: "none", reason: "Enter a username to add as an observer." },
    );
  });

  test("a user the list already holds is not added again", () => {
    expect(
      resolveProjectMemberChange("administrator", [administrator], [administrator, administrator]),
    ).toEqual({
      kind: "none",
      reason: `${administrator} is already an administrator of this project.`,
    });
  });

  test("naming the same new user twice is still that one user", () => {
    expect(
      resolveProjectMemberChange("editor", [administrator], [administrator, colleague, colleague]),
    ).toEqual({ kind: "add", role: "editor", username: colleague });
  });

  test("more than one difference is never guessed at", () => {
    expect(resolveProjectMemberChange("editor", [administrator], [colleague])).toEqual({
      kind: "none",
      reason: "Only one editor can be changed at a time.",
    });
  });
});

test.describe("Project privacy input shaping", () => {
  test("a privacy change states the privacy it sets", () => {
    expect(resolveProjectPrivacyChange(false, true)).toEqual({ isPrivate: true, kind: "set" });
    expect(resolveProjectPrivacyChange(true, false)).toEqual({ isPrivate: false, kind: "set" });
  });

  test("privacy the project already has is never sent", () => {
    expect(resolveProjectPrivacyChange(true, true)).toEqual({
      kind: "none",
      reason: "This project is already private.",
    });
    expect(resolveProjectPrivacyChange(false, false)).toEqual({
      kind: "none",
      reason: "This project is already public.",
    });
  });
});

test.describe("Project command outcomes", () => {
  test("a membership outcome names the user and the role it changed", () => {
    expect(
      projectOutcomeMessage({
        change: "added",
        kind: "membership",
        role: "administrator",
        username: colleague,
      }),
    ).toBe(`${colleague} is now an administrator of this project.`);
    expect(
      projectOutcomeMessage({
        change: "removed",
        kind: "membership",
        role: "observer",
        username: colleague,
      }),
    ).toBe(`${colleague} is no longer an observer of this project.`);
  });

  test("a privacy outcome names the privacy the project now has", () => {
    expect(projectOutcomeMessage({ isPrivate: true, kind: "privacy" })).toBe(
      "This project is now private.",
    );
    expect(projectOutcomeMessage({ isPrivate: false, kind: "privacy" })).toBe(
      "This project is now public.",
    );
  });

  test("taking administration reports the membership it granted", () => {
    expect(projectOutcomeMessage({ kind: "administration" })).toBe(
      "You now administer this project.",
    );
  });

  test("an outcome that changed nothing carries its own reason", () => {
    expect(
      projectOutcomeMessage({ kind: "unchanged", reason: "This project is already private." }),
    ).toBe("This project is already private.");
  });
});

test.describe("Project command failure classification", () => {
  const action = "change the editors of";
  const resource = `project ${projectId}`;

  test("a refusal and a missing resource are the same authoritative rejection", () => {
    const expected = {
      kind: "rejected",
      message: `You cannot ${action} ${resource}. It is unavailable or you do not have access. The displayed project has not changed.`,
    };
    expect(classifyProjectCommandFailure(rejection(403), action, resource)).toEqual(expected);
    expect(classifyProjectCommandFailure(rejection(404), action, resource)).toEqual(expected);
  });

  test("a transport failure keeps the displayed project and offers retry", () => {
    for (const status of [429, 500, 503]) {
      expect(classifyProjectCommandFailure(rejection(status), action, resource)).toEqual({
        kind: "retryable",
        message: `Could not ${action} ${resource}. The displayed project has not changed; retry is available.`,
      });
    }
  });

  test("an unrecognised failure still says the displayed project is unchanged", () => {
    // Its kind hands the detail to the shared error presentation; its message is the only sentence
    // any screen shows, so no screen writes a rejection of its own.
    const expected = {
      kind: "unknown",
      message: `Could not ${action} ${resource}. The displayed project has not changed.`,
    };
    expect(classifyProjectCommandFailure(new Error("boom"), action, resource)).toEqual(expected);
    expect(classifyProjectCommandFailure(rejection(418), action, resource)).toEqual(expected);
  });
});

test.describe("Project mutation ownership", () => {
  const root = path.join(process.cwd(), "src");
  /**
   * The generated mutations that change a project's own privacy and membership. Project deletion
   * is a separate cross-client workflow with its own migration, so it is deliberately not here.
   */
  const generatedProjectMutations =
    /usePatchProject|use(?:Add|Remove)(?:Administrator|Editor|Observer)(?:To|From)Project/u;

  const typescriptSource = /\.tsx?$/u;
  const generated = /(?:^|\/)generated\//u;

  const handwrittenSources = () =>
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      )
      .filter((file) => !generated.test(file) && !file.startsWith("api/"))
      .toSorted();

  test("useProjectCommands is the only holder of a generated project mutation", () => {
    const owners = handwrittenSources().filter((file) =>
      generatedProjectMutations.test(readFileSync(path.join(root, file), "utf8")),
    );
    expect(owners).toEqual(["projects/useProjectCommands.ts"]);
  });

  test("the migrated inventory and stats entry points changed no project of their own", () => {
    // Each retains its report while linking to the one route that owns project privacy and roles.
    for (const report of [
      "administration/UsageInventory.tsx",
      "features/ProjectStats/ProjectActions/ProjectActions.tsx",
    ]) {
      const source = readFileSync(path.join(root, report), "utf8");
      expect(source).not.toMatch(/useQueryClient|invalidateQueries/u);
      expect(source).toContain("projectLinks.manage");
    }
    // The modal that used to own these changes is gone rather than merely unreferenced.
    expect(handwrittenSources().filter((file) => file.includes("EditProject"))).toEqual([]);
  });

  test("every project command invalidates the addressed project and the caller's index", () => {
    const owner = readFileSync(path.join(root, "projects/useProjectCommands.ts"), "utf8");
    // The generated key factories are the only cache identity the owner refreshes.
    expect(owner).toContain("getGetProjectQueryKey(projectId)");
    expect(owner).toContain("getGetProjectsQueryKey()");
    // Every command names the project it changes rather than reading one from anywhere else.
    for (const command of [
      "changeProjectMembers",
      "setProjectPrivacy",
      "takeProjectAdministration",
    ]) {
      expect(owner).toMatch(new RegExp(String.raw`${command}: async \(\s*projectId: string`, "u"));
    }
    expect(owner).not.toMatch(/useCurrentProject|useRouteProject|useSelectedOrganisation/u);
  });

  test("a failed project command is presented once, where the control is", () => {
    // The classified message is the only sentence any screen shows, so Manage does not also hand
    // the same failure to the shared error presentation and report it a second time elsewhere.
    const screen = readFileSync(path.join(root, "projects/ProjectManageActions.tsx"), "utf8");
    expect(screen).toContain("classifyProjectCommandFailure");
    expect(screen).not.toMatch(/enqueueError|enqueueSnackbar/u);
  });

  test("Manage is the only screen that changes project privacy or membership", () => {
    const callers = handwrittenSources().filter((file) =>
      readFileSync(path.join(root, file), "utf8").includes("useProjectCommands()"),
    );
    expect(callers).toEqual(["projects/ProjectManageActions.tsx"]);
  });
});
