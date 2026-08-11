import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { type ServerResponse } from "node:http";
import path from "node:path";

import { filesystemFile } from "../../src/projects/fileFacts";
import {
  FILE_NOT_FOUND_NOTICE,
  fileViewersFor,
  isCompressedFileName,
  offersFileViewer,
  resolveFileViewerDelivery,
} from "../../src/projects/fileViewers";
import {
  parseProjectRoute,
  projectFileResourcePath,
  projectFileTransportLinks,
  projectLinks,
  readProjectFileAddress,
} from "../../src/projects/routes";

const projectId = "project-33333333-3333-3333-3333-333333333333";

const successful = { content: "acceptance notes\n", originalContentLength: 17, truncated: false };

test.describe("Viewed file identity", () => {
  test("splits the one file a viewer addresses from the directory holding it", () => {
    expect(filesystemFile("/notes.txt")).toEqual({
      directory: "/",
      name: "notes.txt",
      path: "/notes.txt",
    });
    expect(filesystemFile("/inputs/poses.sdf")).toEqual({
      directory: "/inputs",
      name: "poses.sdf",
      path: "/inputs/poses.sdf",
    });
    expect(filesystemFile("/inputs/ligands/poses.sdf.gz")).toEqual({
      directory: "/inputs/ligands",
      name: "poses.sdf.gz",
      path: "/inputs/ligands/poses.sdf.gz",
    });
  });

  test("refuses a value that names a directory or cannot name a file at all", () => {
    for (const value of ["/", "//", "inputs/poses.sdf", "", "/inputs/../poses.sdf"]) {
      expect(filesystemFile(value), value).toBeNull();
    }
    // A file path is canonicalised on the way in, exactly as the route that carries it is, so a
    // trailing separator names the same file rather than a second spelling of it.
    expect(filesystemFile("/inputs/poses.sdf/")).toEqual({
      directory: "/inputs",
      name: "poses.sdf",
      path: "/inputs/poses.sdf",
    });
  });

  test("offers the viewers the file itself supports, in one order", () => {
    expect(fileViewersFor("notes.txt")).toEqual(["text", "browser"]);
    expect(fileViewersFor("poses.sdf")).toEqual(["text", "browser", "sdf"]);
    expect(fileViewersFor("poses.sdf.gz")).toEqual(["text", "browser", "sdf"]);
    // A name that merely mentions the extension is not a file of that type.
    expect(fileViewersFor("sdf-notes.txt")).toEqual(["text", "browser"]);
    expect(offersFileViewer("poses.sdf", "sdf")).toBe(true);
    expect(offersFileViewer("notes.txt", "sdf")).toBe(false);
    expect(offersFileViewer("notes.txt", "text")).toBe(true);
    expect(offersFileViewer("notes.txt", "browser")).toBe(true);
  });

  test("reads compression off the name the Data Manager holds the file under", () => {
    expect(isCompressedFileName("poses.sdf.gz")).toBe(true);
    expect(isCompressedFileName("poses.sdf.gzip")).toBe(true);
    expect(isCompressedFileName("poses.sdf")).toBe(false);
    expect(isCompressedFileName("notes.gz.txt")).toBe(false);
  });
});

const recordedResponse = () => ({ statusCode: 200, statusMessage: "" }) as ServerResponse;

test.describe("Viewed file delivery contract", () => {
  test("delivered content is displayed, and empty content is still content", () => {
    expect(resolveFileViewerDelivery(recordedResponse(), successful)).toEqual({
      kind: "content",
      content: successful,
    });
    const empty = { ...successful, content: "" };
    expect(resolveFileViewerDelivery(recordedResponse(), empty)).toEqual({
      kind: "content",
      content: empty,
    });
  });

  test("a file that answered for a viewer fetching its own bytes is readable", () => {
    // The browser viewer and the SDF viewer are told the file is there before they are framed,
    // without the page delivering bytes neither of them would use.
    expect(resolveFileViewerDelivery(recordedResponse(), null)).toEqual({ kind: "readable" });
  });

  test("a refused file answers exactly as a missing one, in the response as well as the page", () => {
    const denied = recordedResponse();
    const missing = recordedResponse();
    expect(
      resolveFileViewerDelivery(denied, { statusCode: 403, statusMessage: "fixture-forbidden" }),
    ).toEqual(
      resolveFileViewerDelivery(missing, { statusCode: 404, statusMessage: "dm-file-not-found" }),
    );
    expect(denied.statusCode).toBe(404);
    expect(denied.statusCode).toBe(missing.statusCode);
    expect(denied.statusMessage).toBe(FILE_NOT_FOUND_NOTICE);
  });

  test("transport failures remain retryable rather than claiming the file is gone", () => {
    for (const statusCode of [401, 429, 500, 502, 503, 504, Number.NaN, 0, -1]) {
      const res = recordedResponse();
      expect(
        resolveFileViewerDelivery(res, { statusCode, statusMessage: "Try again" }),
        String(statusCode),
      ).toEqual({ kind: "recoverable" });
      // Nothing about a failure to deliver is reported as an absent file.
      expect(res.statusCode, String(statusCode)).toBe(200);
    }
  });

  test("other rejections keep their own status", () => {
    expect(
      resolveFileViewerDelivery(recordedResponse(), {
        statusCode: 400,
        statusMessage: "Bad request",
      }),
    ).toEqual({ kind: "failed", statusCode: 400, statusMessage: "Bad request" });
  });
});

test.describe("Project file requests", () => {
  test("a server entry reads one project and one file, or nothing at all", () => {
    expect(readProjectFileAddress(projectId, "/inputs/poses.sdf")).toEqual({
      file: { directory: "/inputs", name: "poses.sdf", path: "/inputs/poses.sdf" },
      projectId,
    });
    for (const [project, path] of [
      ["not-a-project", "/notes.txt"],
      [projectId, "/"],
      [projectId, "notes.txt"],
      [projectId, "/inputs/../secrets.txt"],
      [projectId, undefined],
      [undefined, "/notes.txt"],
      [projectId, ["/notes.txt", "/other.txt"]],
    ] as const) {
      expect(readProjectFileAddress(project, path), String(path)).toBeNull();
    }
  });
});

test.describe("File viewer routes", () => {
  test("the plaintext viewer is the section's default rather than a value the URL carries", () => {
    const canonical = `/projects/${projectId}/files/view?path=%2Finputs%2Fposes.sdf`;
    expect(projectLinks.fileView(projectId, { path: "/inputs/poses.sdf" })).toBe(canonical);
    expect(projectLinks.fileView(projectId, { path: "/inputs/poses.sdf", viewer: "text" })).toBe(
      canonical,
    );
    expect(projectLinks.fileView(projectId, { path: "/inputs/poses.sdf", viewer: "sdf" })).toBe(
      `${canonical}&viewer=sdf`,
    );
    expect(projectLinks.fileView(projectId, { path: "/inputs/poses.sdf", viewer: "browser" })).toBe(
      `${canonical}&viewer=browser`,
    );
  });

  test("a viewer spelled out as the default is replaced by the one canonical URL", () => {
    expect(
      parseProjectRoute(`${projectLinks.fileView(projectId, { path: "/a.txt" })}&viewer=text`),
    ).toEqual({
      canonicalHref: projectLinks.fileView(projectId, { path: "/a.txt" }),
      kind: "valid",
      needsReplace: true,
      route: { kind: "file-view", path: "/a.txt", projectId },
    });
  });

  test("a named viewer round trips without replacement", () => {
    for (const viewer of ["browser", "sdf"] as const) {
      expect(
        parseProjectRoute(projectLinks.fileView(projectId, { path: "/inputs/poses.sdf", viewer })),
        viewer,
      ).toEqual({
        canonicalHref: projectLinks.fileView(projectId, { path: "/inputs/poses.sdf", viewer }),
        kind: "valid",
        needsReplace: false,
        route: { kind: "file-view", path: "/inputs/poses.sdf", projectId, viewer },
      });
    }
  });
});

const withEnvBasePath = <TResult>(value: string | undefined, run: () => TResult): TResult => {
  const previous = process.env.NEXT_PUBLIC_BASE_PATH;
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = value;
  }
  try {
    return run();
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_BASE_PATH = previous;
    }
  }
};

test.describe("Project file transport contract", () => {
  test("every transport addresses the one file beneath the project that holds it", () => {
    expect(projectFileResourcePath(projectId, "/inputs/poses.sdf")).toBe(
      `/project/${projectId}/file?path=%2Finputs&file=poses.sdf`,
    );
    expect(projectFileResourcePath(projectId, "/notes.txt")).toBe(
      `/project/${projectId}/file?path=%2F&file=notes.txt`,
    );
  });

  test("browser transports carry the deployment base path and their own proxy", () => {
    expect(
      withEnvBasePath("/data-manager-ui", () =>
        projectFileTransportLinks.browserView(projectId, "/inputs/poses.sdf"),
      ),
    ).toBe(
      `/data-manager-ui/api/viewer-proxy/project/${projectId}/file?path=%2Finputs&file=poses.sdf`,
    );
    expect(
      withEnvBasePath("/data-manager-ui", () =>
        projectFileTransportLinks.download(projectId, "/inputs/poses.sdf"),
      ),
    ).toBe(`/data-manager-ui/api/dm-api/project/${projectId}/file?path=%2Finputs&file=poses.sdf`);
    expect(
      withEnvBasePath(undefined, () => projectFileTransportLinks.download(projectId, "/notes.txt")),
    ).toBe(`/api/dm-api/project/${projectId}/file?path=%2F&file=notes.txt`);
  });

  test("transport builders reject identity they cannot address", () => {
    expect(() => projectFileResourcePath("not-a-project", "/notes.txt")).toThrow();
    expect(() => projectFileResourcePath(projectId, "/")).toThrow();
    expect(() => projectFileResourcePath(projectId, "notes.txt")).toThrow();
    expect(() => projectFileTransportLinks.browserView(projectId, "/")).toThrow();
    expect(() => projectFileTransportLinks.download(projectId, "/inputs/../notes.txt")).toThrow();
  });
});

test.describe("File viewer cutover", () => {
  test("the standalone viewer pages and their path bridge are gone", () => {
    for (const removed of [
      "src/pages/project/file.tsx",
      "src/pages/viewer/sdf.tsx",
      "src/components/ViewFilePopover",
    ]) {
      expect(existsSync(path.join(process.cwd(), removed)), removed).toBe(false);
    }
    for (const href of ["/project/file", "/viewer/sdf"]) {
      expect(parseProjectRoute(href), href).toEqual({ kind: "not-found" });
    }
  });

  test("project file transport hrefs have one owner", () => {
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

    // Composing the resource path, rather than calling the builder, is what makes a second owner.
    expect(handwrittenMatching(/\/project\/\$\{/u)).toEqual(["projects/routes.ts"]);
  });
});
