import { expect, test } from "@playwright/test";

import { resolveMarkdownHref, resolveMarkdownImageSrc } from "../../src/projects/markdownLinks";
import { projectFileTransportLinks, projectLinks } from "../../src/projects/routes";

const projectId = "project-33333333-3333-3333-3333-333333333333";
const directory = "/notes/today";

const resolve = (href: string) => resolveMarkdownHref(projectId, directory, href);

test.describe("Links inside a Markdown file", () => {
  test("opens a web or mail address outside the application", () => {
    for (const href of ["https://example.com/a?b#c", "http://example.com", "mailto:a@b.org"]) {
      expect(resolve(href), href).toEqual({ external: true, href });
    }
  });

  test("opens another Markdown file in the Markdown Viewer", () => {
    expect(resolve("other.md")).toEqual({
      external: false,
      href: projectLinks.fileView(projectId, { path: "/notes/today/other.md", viewer: "markdown" }),
    });
    expect(resolve("../docs/X.MARKDOWN")).toEqual({
      external: false,
      href: projectLinks.fileView(projectId, {
        path: "/notes/docs/X.MARKDOWN",
        viewer: "markdown",
      }),
    });
  });

  test("opens any other file in its default viewer", () => {
    expect(resolve("data/out.sdf")).toEqual({
      external: false,
      href: projectLinks.fileView(projectId, { path: "/notes/today/data/out.sdf" }),
    });
    // With no extension and no trailing separator, a link still names a file.
    expect(resolve("./docs")).toEqual({
      external: false,
      href: projectLinks.fileView(projectId, { path: "/notes/today/docs" }),
    });
  });

  test("opens a directory when the link ends in a separator", () => {
    expect(resolve("results/")).toEqual({
      external: false,
      href: projectLinks.files(projectId, { path: "/notes/today/results" }),
    });
    expect(resolve("../../")).toEqual({ external: false, href: projectLinks.files(projectId) });
    expect(resolve("..")).toEqual({
      external: false,
      href: projectLinks.files(projectId, { path: "/notes" }),
    });
  });

  test("resolves an absolute path from the project root", () => {
    expect(resolve("/abs/path")).toEqual({
      external: false,
      href: projectLinks.fileView(projectId, { path: "/abs/path" }),
    });
    expect(resolve("/")).toEqual({ external: false, href: projectLinks.files(projectId) });
  });

  test("reads an encoded name and ignores a fragment or query", () => {
    expect(resolve("my%20file.md#part")).toEqual({
      external: false,
      href: projectLinks.fileView(projectId, {
        path: "/notes/today/my file.md",
        viewer: "markdown",
      }),
    });
    expect(resolve("out.sdf?x=1")).toEqual({
      external: false,
      href: projectLinks.fileView(projectId, { path: "/notes/today/out.sdf" }),
    });
  });

  test("leaves as plain text a link that names nothing in the project", () => {
    for (const href of [
      "../../../escape.md",
      "/../x",
      "#anchor",
      "",
      "%E0%A4%A",
      "javascript:alert(1)",
      "ftp://example.com/x",
      "irc:example",
    ]) {
      expect(resolve(href), href).toBeNull();
    }
  });
});

test.describe("Images inside a Markdown file", () => {
  test("loads a project image through the viewer proxy", () => {
    expect(resolveMarkdownImageSrc(projectId, directory, "img/plot.png")).toBe(
      projectFileTransportLinks.browserView(projectId, "/notes/today/img/plot.png"),
    );
    expect(resolveMarkdownImageSrc(projectId, directory, "/figures/a.svg")).toBe(
      projectFileTransportLinks.browserView(projectId, "/figures/a.svg"),
    );
  });

  test("drops a web image and anything else outside the project", () => {
    for (const src of [
      "https://example.com/a.png",
      "../../../a.png",
      "img/",
      "mailto:a@b.org",
      "data:image/png;base64,AA",
    ]) {
      expect(resolveMarkdownImageSrc(projectId, directory, src), src).toBeNull();
    }
  });
});
