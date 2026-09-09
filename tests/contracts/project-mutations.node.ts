import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { NetworkTransportError } from "../../src/api/runtime/classifyTransportFailure";
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

/** A rejection in the shape both specs document for every 4xx they carry a body on. */
const documented = (status: number, error: string) => ({
  isAxiosError: true,
  response: { status, data: { error } },
});

/** The same rejection in the framework's own shape, which neither spec documents. */
const framework = (status: number, detail: string) => ({
  isAxiosError: true,
  response: { status, data: { detail, status, title: "Bad Request", type: "about:blank" } },
});

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

  test("an outcome that changed nothing carries its own reason", () => {
    expect(
      projectOutcomeMessage({ kind: "unchanged", reason: "This project is already private." }),
    ).toBe("This project is already private.");
  });
});

test.describe("Project command failure classification", () => {
  const action = "change the editors of";
  const resource = `project ${projectId}`;
  const unchanged = "The displayed project has not changed";
  const unavailable = `You cannot ${action} ${resource}. It is unavailable or you do not have access. ${unchanged}.`;

  /**
   * What each rejection status these services answer a project command with actually says, and
   * therefore what the caller is now told. Every one of them was flattened into a sentence of this
   * client's, and the membership rules in particular were unlearnable from it.
   */
  const rejections = [
    { reason: "Too few administrators", status: 400 },
    { reason: "Too few editors", status: 400 },
    { reason: "Too few observers", status: 400 },
    { reason: "Not an Administrator (odudgeon)", status: 403 },
    { reason: "Editor not in Project (nosuchuser)", status: 404 },
    { reason: "Application exists", status: 409 },
    { reason: "Unsupported Media Type", status: 415 },
    { reason: "It was not possible to convert the Dataset to the format desired", status: 422 },
  ];

  for (const { reason, status } of rejections) {
    test(`a ${status} answering “${reason}” states that reason, in either body shape`, () => {
      const expected = { kind: "rejected", message: `${reason}. ${unchanged}.` };
      expect(classifyProjectCommandFailure(documented(status, reason), action, resource)).toEqual(
        expected,
      );
      expect(classifyProjectCommandFailure(framework(status, reason), action, resource)).toEqual(
        expected,
      );
    });
  }

  test("a refusal that said nothing is the one place the canned sentence is reached", () => {
    // With no words at all a refusal and an absence really are indistinguishable to this client,
    // which is the only reason one sentence still covers both.
    expect(classifyProjectCommandFailure(rejection(403), action, resource)).toEqual({
      kind: "rejected",
      message: unavailable,
    });
    expect(classifyProjectCommandFailure(rejection(404), action, resource)).toEqual({
      kind: "rejected",
      message: unavailable,
    });
    // Every other refusal that accounted for itself with nothing is still a refusal, so none of
    // them offers a retry that cannot work.
    for (const status of [400, 409, 415, 422]) {
      expect(
        classifyProjectCommandFailure(rejection(status), action, resource),
        String(status),
      ).toEqual({ kind: "rejected", message: `Could not ${action} ${resource}. ${unchanged}.` });
    }
  });

  test("a command the service will not allow at all says retrying cannot change it", () => {
    // `405` is the Data Manager refusing the command on the target itself — a managed file cannot
    // be deleted — so the caller is told the attempt can never succeed rather than left to repeat it.
    const reason = "Forbidden from deleting the file";
    for (const answer of [documented(405, reason), framework(405, reason)]) {
      expect(classifyProjectCommandFailure(answer, action, resource)).toEqual({
        kind: "rejected",
        message: `${reason}. Retrying cannot change that. ${unchanged}.`,
      });
    }
    expect(classifyProjectCommandFailure(rejection(405), action, resource)).toEqual({
      kind: "rejected",
      message: `You cannot ${action} ${resource}. Retrying cannot change that. ${unchanged}.`,
    });
  });

  test("a transport fact says nothing about the command, whatever body it arrived with", () => {
    // Each of the four is exercised in both body shapes and with no body at all: a transport fact
    // carries no account of *this command*, so nothing a body happened to hold stands in front of
    // the one sentence that says the request is still worth sending.
    const expected = {
      kind: "retryable",
      message: `Could not ${action} ${resource}. ${unchanged}; retry is available.`,
    };
    const transportFailures = [
      { cause: new NetworkTransportError(new Error("offline")), kind: "network" },
      { cause: { isAxiosError: true, data: { error: "connection reset" } }, kind: "network" },
      { cause: { isAxiosError: true, data: { detail: "Connection aborted" } }, kind: "network" },
      { cause: { isAxiosError: true, code: "ECONNABORTED" }, kind: "timeout" },
      {
        cause: { isAxiosError: true, code: "ETIMEDOUT", data: { error: "read timed out" } },
        kind: "timeout",
      },
      {
        cause: { isAxiosError: true, code: "ETIMEDOUT", data: { detail: "Gateway Timeout" } },
        kind: "timeout",
      },
      { cause: rejection(429), kind: "rate-limited" },
      { cause: documented(429, "fixture-rate-limited"), kind: "rate-limited" },
      { cause: framework(429, "Too Many Requests"), kind: "rate-limited" },
      { cause: rejection(500), kind: "server" },
      { cause: documented(503, "fixture-server-error"), kind: "server" },
      { cause: framework(503, "Service Unavailable"), kind: "server" },
    ];
    for (const { cause, kind } of transportFailures) {
      expect(classifyProjectCommandFailure(cause, action, resource), kind).toEqual(expected);
    }
  });

  test("a token the service will not accept reads as the refusal it always read as", () => {
    // Its own words are the scopes whoever holds the client registration would need, which is
    // nothing the caller of this command can act on, in whichever shape they arrive.
    const scopes = "Provided token does not have the required scopes. Provided: []";
    for (const answer of [documented(403, scopes), framework(403, scopes)]) {
      expect(classifyProjectCommandFailure(answer, action, resource)).toEqual({
        kind: "rejected",
        message: unavailable,
      });
    }
  });

  test("an unrecognised failure still says the displayed project is unchanged", () => {
    const expected = { kind: "unknown", message: `Could not ${action} ${resource}. ${unchanged}.` };
    expect(classifyProjectCommandFailure(new Error("boom"), action, resource)).toEqual(expected);
    expect(classifyProjectCommandFailure(rejection(418), action, resource)).toEqual(expected);
    // A status this client cannot classify is not known to be a refusal, but whatever the answer
    // did say is still better than a sentence written here.
    for (const answer of [documented(418, "Teapot"), framework(418, "Teapot")]) {
      expect(classifyProjectCommandFailure(answer, action, resource)).toEqual({
        kind: "unknown",
        message: `Teapot. ${unchanged}.`,
      });
    }
  });
});

test.describe("Project mutation ownership", () => {
  const root = path.join(process.cwd(), "src");
  /**
   * The generated mutations that change a project's own privacy and membership. Project deletion
   * is a separate cross-client workflow, so it has its own owner and its own case below.
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

  const generatedProjectDeletion = /useDeleteProject\b/u;
  const generatedSubscriptionDeletion = /useDeleteProduct\b/u;

  test("useProjectDeletionCommands is the only holder of the generated project deletion", () => {
    const owners = handwrittenSources().filter((file) =>
      generatedProjectDeletion.test(readFileSync(path.join(root, file), "utf8")),
    );
    expect(owners).toEqual(["projects/useProjectDeletionCommands.ts"]);
  });

  test("every subscription deletion belongs to a named workflow owner", () => {
    // Removing a billing record belongs to Administration, to project creation's cleanup, and to
    // project deletion; no report, table, or project screen may hold the mutation that does it.
    const owners = handwrittenSources().filter((file) =>
      generatedSubscriptionDeletion.test(readFileSync(path.join(root, file), "utf8")),
    );
    expect(owners).toEqual([
      "administration/useSubscriptionCommands.ts",
      "projects/useProjectCreationCommands.ts",
      "projects/useProjectDeletionCommands.ts",
    ]);
  });

  test("the migrated inventory report changed no project of its own", () => {
    // It retains its report while linking to the one route that owns project privacy and roles.
    const source = readFileSync(path.join(root, "administration/UsageInventory.tsx"), "utf8");
    expect(source).not.toMatch(/useQueryClient|invalidateQueries/u);
    expect(source).toContain("projectLinks.manage");
    // The modal that used to own these changes is gone rather than merely unreferenced, and so is
    // the project-stats section that offered a second set of project actions beside it.
    expect(
      handwrittenSources().filter((file) => file.includes("EditProject") || file.includes("Stats")),
    ).toEqual([]);
  });

  test("every project command invalidates the addressed project and the caller's index", () => {
    const owner = readFileSync(path.join(root, "projects/useProjectCommands.ts"), "utf8");
    // The generated key factories are the only cache identity the owner refreshes.
    expect(owner).toContain("getGetProjectQueryKey(projectId)");
    expect(owner).toContain("getGetProjectsQueryKey()");
    // Every command names the project it changes rather than reading one from anywhere else.
    for (const command of ["changeProjectMembers", "setProjectPrivacy"]) {
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
