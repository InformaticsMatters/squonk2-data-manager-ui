import { type FilePathFile } from "@/api/data-manager";
import { getGetFilesQueryKey } from "@/api/data-manager/file-and-path";

import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateProjectFileMutationCapability,
  type ProjectCapabilityFacts,
} from "../../src/projects/capabilities";
import {
  canonicalFilesystemPath,
  childFilesystemPath,
  existingDirectoryNames,
  fileRowMode,
  filesystemBreadcrumbs,
  filesystemPathOf,
  isDirectoryRow,
  managedFileId,
  offersDatasetCreation,
  parentFilesystemPath,
  projectFileRequests,
  relativeFilesystemPath,
  resolveProjectFileContent,
  selectProjectFileRows,
} from "../../src/projects/fileFacts";
import {
  isFavouriteFile,
  projectFavourites,
  toggleFavouriteFile,
} from "../../src/projects/fileFavourites";
import {
  fileOutcomeMessage,
  listingPathsChangedByMove,
  resolveDatasetCreation,
  type ResolvedFileMove,
  resolveDirectoryCreation,
  resolveFileMove,
} from "../../src/projects/fileMutations";
import { parseProjectRoute, projectLinks } from "../../src/projects/routes";
import { resolveSectionFreshness, resolveSectionReadState } from "../../src/projects/sectionReads";

const projectId = "project-33333333-3333-3333-3333-333333333333";
const otherProjectId = "project-44444444-4444-4444-4444-444444444444";

const file = (
  overrides: Partial<FilePathFile> & Pick<FilePathFile, "file_name">,
): FilePathFile => ({
  owner: "owner",
  stat: { modified: "2026-01-02T03:04:05Z", size: 10 },
  ...overrides,
});

test.describe("filesystem path canonicalisation", () => {
  test("gives every spelling of one directory the same canonical form", () => {
    for (const [input, expected] of [
      ["/", "/"],
      ["//", "/"],
      ["/inputs", "/inputs"],
      ["/inputs/", "/inputs"],
      ["/inputs//results", "/inputs/results"],
      ["/inputs/results/", "/inputs/results"],
      // A leading dot names a hidden directory, which the Data Manager itself creates for an
      // instance's own output, so it is a path and not a relative reference.
      ["/.instance-1", "/.instance-1"],
    ] as const) {
      expect(canonicalFilesystemPath(input), input).toBe(expected);
    }
  });

  test("refuses a value that cannot name a directory rather than resolving it", () => {
    for (const input of [
      "inputs",
      "",
      "../inputs",
      "/inputs/../secrets",
      "/inputs/./results",
      "/inputs\u0000",
      `/${"a".repeat(300)}`,
    ]) {
      expect(canonicalFilesystemPath(input), input).toBeNull();
    }
  });

  test("walks a path into the directories it addresses", () => {
    expect(filesystemBreadcrumbs("/")).toEqual([]);
    expect(filesystemBreadcrumbs("/inputs/results")).toEqual(["inputs", "results"]);
    expect(parentFilesystemPath("/inputs/results")).toBe("/inputs");
    expect(parentFilesystemPath("/inputs")).toBe("/");
    expect(parentFilesystemPath("/")).toBe("/");
    expect(filesystemPathOf([])).toBe("/");
    expect(filesystemPathOf(["inputs", "results"])).toBe("/inputs/results");
    expect(childFilesystemPath("/", "inputs")).toBe("/inputs");
    expect(childFilesystemPath("/inputs", "results")).toBe("/inputs/results");
    // A favourite and a job input carry the project-root relative spelling, never the route one.
    expect(relativeFilesystemPath("/", "poses.sdf")).toBe("poses.sdf");
    expect(relativeFilesystemPath("/inputs", "poses.sdf")).toBe("inputs/poses.sdf");
  });
});

test.describe("Files routes", () => {
  test("the root is the section's default rather than a value the URL carries", () => {
    expect(projectLinks.files(projectId)).toBe(`/projects/${projectId}/files`);
    expect(projectLinks.files(projectId, { path: "/" })).toBe(`/projects/${projectId}/files`);
    expect(projectLinks.files(projectId, { path: "/inputs" })).toBe(
      `/projects/${projectId}/files?path=%2Finputs`,
    );
  });

  test("a non-canonical path in a URL is replaced by its canonical spelling", () => {
    for (const [href, expected] of [
      [`/projects/${projectId}/files?path=%2F`, undefined],
      [`/projects/${projectId}/files?path=%2Finputs%2F`, "/inputs"],
      [`/projects/${projectId}/files?path=%2Finputs%2F%2Fresults`, "/inputs/results"],
      // A path that cannot name a directory is dropped rather than walked or guessed at.
      [`/projects/${projectId}/files?path=inputs`, undefined],
      [`/projects/${projectId}/files?path=%2Finputs%2F..%2Fsecrets`, undefined],
    ] as const) {
      const parsed = parseProjectRoute(href);
      expect(parsed, href).toEqual({
        canonicalHref: projectLinks.files(projectId, expected ? { path: expected } : {}),
        kind: "valid",
        needsReplace: true,
        route: { kind: "files", projectId, ...(expected ? { path: expected } : {}) },
      });
    }
  });

  test("a canonical Files route round trips without replacement", () => {
    expect(parseProjectRoute(`/projects/${projectId}/files?path=%2Finputs%2Fresults`)).toEqual({
      canonicalHref: projectLinks.files(projectId, { path: "/inputs/results" }),
      kind: "valid",
      needsReplace: false,
      route: { kind: "files", path: "/inputs/results", projectId },
    });
  });

  test("a file route the section cannot address is answered beneath the project it names", () => {
    for (const href of [
      `/projects/${projectId}/files/view`,
      `/projects/${projectId}/files/view?path=%2F`,
      `/projects/${projectId}/files/view?path=inputs%2Fposes.sdf`,
      `/projects/${projectId}/files/view?path=%2Finputs%2F..%2Fsecrets`,
    ]) {
      expect(parseProjectRoute(href), href).toEqual({
        kind: "not-found",
        parent: { family: "projects", resourceId: projectId, section: "files" },
      });
    }
  });

  test("the file view route has a page entry, so the section answers instead of the application", () => {
    // Without one, Next answers the URL before the route contract is ever consulted, and a file
    // path the section could not address would lose the valid project shell it names. The viewer
    // itself arrives with its own migration; this entry is what lets Files answer for the route.
    expect(
      existsSync(path.join(process.cwd(), "src/pages/projects/[projectId]/files/view.tsx")),
    ).toBe(true);
  });

  test("a builder rejects a path it cannot canonicalise rather than writing a guess", () => {
    expect(() => projectLinks.files(projectId, { path: "inputs" })).toThrow();
    expect(() => projectLinks.files(projectId, { path: "/inputs/../secrets" })).toThrow();
    // A viewer addresses one file, so the root — which names a directory — is never a file path.
    expect(() => projectLinks.fileView(projectId, { path: "/" })).toThrow();
  });
});

test.describe("Files reads", () => {
  test("every read names the project in the URL and the path Files owns", () => {
    expect(projectFileRequests(projectId, "/inputs")).toEqual({
      files: { path: "/inputs", project_id: projectId },
    });
    // The generated key factory is the only cache identity, and it is built from that request.
    expect(getGetFilesQueryKey(projectFileRequests(projectId, "/inputs").files)).not.toEqual(
      getGetFilesQueryKey(projectFileRequests(otherProjectId, "/inputs").files),
    );
    expect(getGetFilesQueryKey(projectFileRequests(projectId, "/inputs").files)).not.toEqual(
      getGetFilesQueryKey(projectFileRequests(projectId, "/").files),
    );
  });

  test("lists directories first and nests the files that only describe another file", () => {
    const rows = selectProjectFileRows({
      files: [
        file({ file_name: "poses.sdf", file_id: "file-1" }),
        file({ file_name: "poses.schema.json" }),
        file({ file_name: "poses.meta.json" }),
        file({ file_name: "notes.txt" }),
      ],
      path: "/inputs",
      paths: ["results"],
    });

    expect(rows.map((row) => row.name)).toEqual(["results", "poses.sdf", "notes.txt"]);
    expect(rows.map((row) => row.fullPath)).toEqual([
      "inputs/results",
      "inputs/poses.sdf",
      "inputs/notes.txt",
    ]);
    expect(isDirectoryRow(rows[0])).toBe(true);
    expect(rows[1].subRows.map((row) => row.name)).toEqual([
      "poses.schema.json",
      "poses.meta.json",
    ]);
    expect(rows[2].subRows).toEqual([]);
    expect(existingDirectoryNames(rows)).toEqual(["results"]);
  });

  test("takes how a file is held from the generated resource rather than from its name", () => {
    const rows = selectProjectFileRows({
      files: [
        file({ file_name: "managed.sdf", file_id: "file-1" }),
        file({ file_name: "locked.sdf", file_id: "file-2", immutable: true }),
        file({ file_name: "loose.sdf" }),
      ],
      path: "/",
      paths: [],
    });

    expect(rows.map((row) => (isDirectoryRow(row) ? "-" : fileRowMode(row)))).toEqual([
      "editable",
      "immutable",
      "unmanaged",
    ]);
    expect(rows.map((row) => (isDirectoryRow(row) ? undefined : managedFileId(row)))).toEqual([
      "file-1",
      "file-2",
      undefined,
    ]);
    // A dataset is made from anything the project still holds in its own right. A managed file the
    // Data Manager has fixed is already a dataset version, so it is the one that offers nothing.
    expect(
      rows.map((row) => (isDirectoryRow(row) ? undefined : offersDatasetCreation(row))),
    ).toEqual([true, false, true]);
  });

  test("a refused or absent directory clears its listing while a failed refresh keeps it stale", () => {
    expect(resolveSectionReadState(new Response(null, { status: 404 }))).toEqual({
      kind: "unavailable",
    });
    expect(resolveSectionReadState(new Response(null, { status: 403 }))).toEqual({
      kind: "unavailable",
    });
    const recoverable = resolveSectionReadState(new Response(null, { status: 503 }));
    expect(recoverable).toEqual({ kind: "recoverable", retryable: true });
    expect(resolveSectionFreshness(recoverable)).toBe("stale");
    expect(resolveSectionFreshness(resolveSectionReadState(null))).toBe("current");
  });
});

test.describe("Files favourites", () => {
  test("a favourite belongs to the project whose file it is and to no other", () => {
    const first = toggleFavouriteFile({}, projectId, { path: "poses.sdf", type: "file" });
    const both = toggleFavouriteFile(first, otherProjectId, { path: "poses.sdf", type: "file" });

    expect(projectFavourites(both, projectId).map(({ path }) => path)).toEqual(["poses.sdf"]);
    expect(projectFavourites(both, otherProjectId).map(({ path }) => path)).toEqual(["poses.sdf"]);
    expect(isFavouriteFile(projectFavourites(both, projectId), "poses.sdf")).toBe(true);
    // A project the caller has never favourited anything in has no favourites, rather than
    // inheriting another project's.
    expect(projectFavourites(both, "project-00000000-0000-0000-0000-000000000000")).toEqual([]);

    const removed = toggleFavouriteFile(both, projectId, { path: "poses.sdf", type: "file" });
    expect(projectFavourites(removed, projectId)).toEqual([]);
    expect(projectFavourites(removed, otherProjectId).map(({ path }) => path)).toEqual([
      "poses.sdf",
    ]);
  });
});

test.describe("Files mutations", () => {
  test("resolves the one directory a create request expresses", () => {
    expect(resolveDirectoryCreation("/inputs", "results", [])).toEqual({
      kind: "create",
      name: "results",
      path: "/inputs/results",
    });
    expect(resolveDirectoryCreation("/", " results ", [])).toEqual({
      kind: "create",
      name: "results",
      path: "/results",
    });

    for (const [name, existing, reason] of [
      ["", [], "Enter a name for the new directory."],
      ["  ", [], "Enter a name for the new directory."],
      ["a/b", [], "A directory name cannot contain a separator."],
      ["..", [], "A directory name cannot be a relative path."],
      ["results", ["results"], "This directory already exists."],
    ] as const) {
      expect(resolveDirectoryCreation("/inputs", name, existing), name).toEqual({
        kind: "none",
        reason,
      });
    }
  });

  test("shapes a directory move and a file move into their own generated arguments", () => {
    expect(resolveFileMove("directory", "inputs/results", "outputs/results")).toEqual({
      destination: "/outputs/results",
      kind: "move-directory",
      source: "/inputs/results",
    });
    expect(resolveFileMove("file", "inputs/poses.sdf", "outputs/final.sdf")).toEqual({
      destination: "final.sdf",
      destinationPath: "/outputs",
      kind: "move-file",
      name: "poses.sdf",
      path: "/inputs",
    });
    // A file moving to the project root keeps the root as its destination path.
    expect(resolveFileMove("file", "inputs/poses.sdf", "poses.sdf")).toEqual({
      destination: "poses.sdf",
      destinationPath: "/",
      kind: "move-file",
      name: "poses.sdf",
      path: "/inputs",
    });
  });

  test("a move names the listings that displayed the item rather than the item itself", () => {
    // A directory moves as its own path, but the listings showing it are the ones it left and the
    // one it arrived in, so refreshing the moved path itself would leave the old name on screen.
    expect(
      listingPathsChangedByMove(
        resolveFileMove("directory", "inputs/results", "outputs/results") as ResolvedFileMove,
      ),
    ).toEqual(["/inputs", "/outputs"]);
    // A directory renamed in place is displayed by one listing, which is named once.
    expect(
      listingPathsChangedByMove(
        resolveFileMove("directory", "inputs/results", "inputs/final") as ResolvedFileMove,
      ),
    ).toEqual(["/inputs", "/inputs"]);
    // A directory moved into or out of the project root names the root itself.
    expect(
      listingPathsChangedByMove(
        resolveFileMove("directory", "results", "inputs/results") as ResolvedFileMove,
      ),
    ).toEqual(["/", "/inputs"]);
    // A file already carries its containing directories, so it names exactly those.
    expect(
      listingPathsChangedByMove(
        resolveFileMove("file", "inputs/poses.sdf", "outputs/final.sdf") as ResolvedFileMove,
      ),
    ).toEqual(["/inputs", "/outputs"]);
  });

  test("a move that changes nothing, or cannot be spelled, is reported rather than sent", () => {
    expect(resolveFileMove("file", "poses.sdf", "poses.sdf")).toEqual({
      kind: "none",
      reason: "This is already the name of this item.",
    });
    for (const destination of ["/poses.sdf", "poses.sdf/", "", "in puts/poses.sdf"]) {
      expect(resolveFileMove("file", "poses.sdf", destination), destination).toEqual({
        kind: "none",
        reason: "The path is invalid. It should not start or end with a slash.",
      });
    }
  });

  test("a dataset is only sent for a file whose type the Data Manager can be told", () => {
    expect(
      resolveDatasetCreation({
        fileName: "poses.sdf",
        mimeType: "chemical/x-mdl-sdfile",
        path: "/inputs",
      }),
    ).toEqual({
      datasetType: "chemical/x-mdl-sdfile",
      fileName: "poses.sdf",
      kind: "create",
      path: "/inputs",
    });
    for (const mimeType of [undefined, ""]) {
      expect(resolveDatasetCreation({ fileName: "notes", mimeType, path: "/" })).toEqual({
        kind: "none",
        reason: "This file's type is not one a dataset can be created from.",
      });
    }
  });

  test("every outcome states what happened rather than what was attempted", () => {
    expect(fileOutcomeMessage({ kind: "created-directory", name: "results" })).toBe(
      "results was created.",
    );
    expect(fileOutcomeMessage({ kind: "deleted", name: "results", type: "directory" })).toBe(
      "The directory results was deleted.",
    );
    expect(fileOutcomeMessage({ kind: "detached", name: "poses.sdf" })).toBe(
      "poses.sdf was detached from this project.",
    );
    expect(
      fileOutcomeMessage({ kind: "unchanged", reason: "This directory already exists." }),
    ).toBe("This directory already exists.");
  });
});

const facts = (overrides: Partial<ProjectCapabilityFacts> = {}): ProjectCapabilityFacts => ({
  caller: { isPlatformAdministrator: false, username: "editor" },
  project: { administrators: [], creator: "creator", editors: ["editor"], observers: [] },
  subscription: { accountsForInstances: true, atLimit: false },
  ...overrides,
});

test.describe("Files capabilities", () => {
  test("an editor of the project in the URL may change its files", () => {
    expect(evaluateProjectFileMutationCapability(facts())).toEqual({ status: "enabled" });
  });

  test("an observer is told what changing files requires", () => {
    expect(
      evaluateProjectFileMutationCapability(
        facts({
          project: { administrators: [], creator: "creator", editors: [], observers: ["editor"] },
        }),
      ),
    ).toEqual({
      reason: "You must be a project editor or administrator to change project files.",
      status: "disabled",
    });
  });

  test("a listing that could not be established disables changes rather than offering them", () => {
    expect(evaluateProjectFileMutationCapability({ ...facts(), content: "stale" })).toEqual({
      reason:
        "This directory could not be refreshed, so changing its contents cannot be established as safe.",
      status: "disabled",
    });
    // A cleared listing establishes as little about the directory as a stale one, so a change into
    // it is no safer for the content having been removed rather than left behind.
    expect(evaluateProjectFileMutationCapability({ ...facts(), content: "unavailable" })).toEqual({
      reason:
        "This directory is unavailable, so changing its contents cannot be established as safe.",
      status: "disabled",
    });
    // A confirmed lack of authority is the more useful explanation, so it is still reported first.
    expect(
      evaluateProjectFileMutationCapability({
        ...facts({
          project: { administrators: [], creator: "creator", editors: [], observers: ["editor"] },
        }),
        content: "stale",
      }),
    ).toEqual({
      reason: "You must be a project editor or administrator to change project files.",
      status: "disabled",
    });
  });

  test("a directory that has not answered yet establishes nothing to change", () => {
    // A listing with no error yet has still told the caller nothing about the directory: the names
    // it holds are unknown, so a change sent into it could collide with one that is already there.
    expect(resolveProjectFileContent(resolveSectionReadState(null), false)).toBe("unestablished");
    expect(resolveProjectFileContent(resolveSectionReadState(null), true)).toBe("current");
    // Content already on screen is stale rather than unestablished, however its refresh failed.
    const recoverable = resolveSectionReadState(new Response(null, { status: 503 }));
    expect(resolveProjectFileContent(recoverable, true)).toBe("stale");
    expect(resolveProjectFileContent(recoverable, false)).toBe("stale");
    // A confirmed refusal or absence outranks both, because it is the one settled answer.
    expect(
      resolveProjectFileContent(
        resolveSectionReadState(new Response(null, { status: 404 })),
        false,
      ),
    ).toBe("unavailable");

    expect(evaluateProjectFileMutationCapability({ ...facts(), content: "unestablished" })).toEqual(
      {
        reason:
          "This directory has not loaded yet, so changing its contents cannot be established as safe.",
        status: "disabled",
      },
    );
  });

  test("a subscription at its coin limit explains why files cannot be changed", () => {
    expect(
      evaluateProjectFileMutationCapability(
        facts({ subscription: { accountsForInstances: true, atLimit: true } }),
      ),
    ).toEqual({
      reason: "This project's subscription is at its coin limit, so files cannot be changed.",
      status: "disabled",
    });
  });

  test("facts that cannot confirm authority leave the action available with its requirement", () => {
    const capability = evaluateProjectFileMutationCapability(facts({ freshness: "stale" }));
    expect(capability.status).toBe("enabled");
    expect(capability.status === "enabled" && capability.reason).toContain(
      "You must be a project editor or administrator to change project files.",
    );
  });
});

test.describe("Files cutover", () => {
  test("the legacy global project page and its file feature are gone", () => {
    for (const removed of [
      "src/pages/project.tsx",
      "src/features/ProjectTable",
      "src/hooks/projectPathHooks.ts",
      "src/state/fileSelection.ts",
      "src/hooks/api/useMoveProjectObject.ts",
    ]) {
      expect(existsSync(path.join(process.cwd(), removed)), removed).toBe(false);
    }
    // The parser answers for the removed route rather than guessing a correction for it.
    for (const href of ["/project", `/project?project=${projectId}`]) {
      expect(parseProjectRoute(href)).toEqual({ kind: "not-found" });
    }
  });

  test("no handwritten module composes the legacy project route or reads a selected project", () => {
    const typescriptSource = /\.tsx?$/u;
    const generated = /(?:^|\/)generated\//u;
    const root = path.join(process.cwd(), "src");
    const handwrittenMatching = (matches: RegExp) =>
      readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
        .map((entry) =>
          path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
        )
        .filter((file) => !generated.test(file))
        .filter((file) => matches.test(readFileSync(path.join(root, file), "utf8")))
        .toSorted();

    // Composing the legacy project path, rather than calling the family builder, would be a second
    // owner of the route.
    expect(handwrittenMatching(/pathname: ["'`]\/project["'`]/u)).toEqual([]);
    // Files reads the project and the path from the URL alone.
    for (const sourceFile of [
      "projects/ProjectFiles.tsx",
      "projects/ProjectFileActions.tsx",
      "projects/ProjectFileUpload.tsx",
      "projects/ProjectFileToolbarActions.tsx",
      "projects/ProjectFileFavouriteButton.tsx",
      "projects/fileFacts.ts",
      "projects/fileFavourites.ts",
      "projects/fileMutations.ts",
      "projects/useProjectFiles.ts",
      "projects/useFileCommands.ts",
      "components/ViewFilePopover/ViewFilePopover.tsx",
      "components/ViewFilePopover/FileViewersList.tsx",
      "components/instances/JobDetails/JobLink.tsx",
      "components/FileSelector/FileListItem.tsx",
      "components/FileSelector/FavouritesList.tsx",
      "components/FileSelector/MiniFileList.tsx",
    ]) {
      expect(readFileSync(path.join(root, sourceFile), "utf8"), sourceFile).not.toMatch(
        /useCurrentProject|useCurrentProjectId|useIsUserAdminOrEditorOfCurrentProject|useSelectedUnit/u,
      );
    }
  });
});
