import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { docsEntries, docsManifest } from "../../src/content/docs/manifest";

const root = process.cwd();
const contentRoot = path.join(root, "src/content/docs");
const pagesRoot = path.join(root, "src/pages/docs");
const assetsRoot = path.join(contentRoot, "assets");

/** The `.mdx` file one manifest href's content lives in, and the page entry that serves it. */
const filesFor = (href: string) => {
  // `/docs` is the tree's own root, whose content is `index.mdx` beside the rest of the tree.
  const relative = href === "/docs" ? "index" : href.slice("/docs/".length);
  return {
    content: path.join(contentRoot, `${relative}.mdx`),
    page: path.join(pagesRoot, `${href === "/docs" ? "index" : relative}.tsx`),
  };
};

/** Every file of one kind under a root, as a path relative to that root, without its extension. */
const filesUnder = (directory: string, extension: string) =>
  readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) =>
      path
        .relative(directory, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join("/")
        .slice(0, -extension.length),
    )
    .toSorted();

const manifestHrefs = docsEntries().map((entry) => entry.node.href);

/**
 * Every markdown link the documentation writes at a documentation page, in the file that writes it.
 * Both spellings are collected: a `/docs/…` absolute, and a relative link resolved against the page
 * writing it — the second is what left one page linking a twin the index did not.
 */
const documentationLinks = () =>
  filesUnder(contentRoot, ".mdx").flatMap((file) => {
    const source = readFileSync(path.join(contentRoot, `${file}.mdx`), "utf8");
    const pageHref = file === "index" ? "/docs" : `/docs/${file}`;
    const directory = pageHref.split("/").slice(0, -1).join("/");

    return [...source.matchAll(/\]\((?<target>[^)\s]+)\)/gu)]
      .map((match) => match.groups?.target ?? "")
      .filter((target) => target.startsWith("/docs") || target.startsWith("./"))
      .map((target) => ({
        file: `${file}.mdx`,
        href: target.startsWith("./") ? `${directory}/${target.slice(2)}` : target,
      }));
  });

test.describe("the documentation manifest owns the tree", () => {
  test("every manifest entry has content and a page entry", () => {
    for (const href of manifestHrefs) {
      const { content, page } = filesFor(href);
      expect(existsSync(content), content).toBe(true);
      expect(existsSync(page), page).toBe(true);
    }
  });

  test("no content file is served at a URL the manifest does not own", () => {
    // The orphan this guards against was a near-copy of another page, served at its own URL,
    // reachable from one parent while its twin was reachable from another — which is how the two
    // diverged for a year without anyone noticing either.
    const owned = manifestHrefs.map((href) =>
      href === "/docs" ? "index" : href.slice("/docs/".length),
    );
    expect(filesUnder(contentRoot, ".mdx")).toEqual(owned.toSorted());
  });

  test("no page entry serves a URL the manifest does not own", () => {
    const owned = manifestHrefs.map((href) =>
      href === "/docs" ? "index" : href.slice("/docs/".length),
    );
    expect(filesUnder(pagesRoot, ".tsx")).toEqual(owned.toSorted());
  });

  test("the tree's root is the documentation index itself", () => {
    expect(docsManifest.href).toBe("/docs");
  });
});

test.describe("documentation assets are the ones the content uses", () => {
  test("every asset is imported by a page, and every import resolves to an asset", () => {
    // The tree carried three assets nothing referenced, left behind by a sweep that dropped the
    // panels they showed. An image is only worth keeping while a page still shows it, so the two
    // sets are required to be the same one rather than merely to overlap.
    const held = readdirSync(assetsRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .toSorted();
    const imported = [
      ...new Set(
        filesUnder(contentRoot, ".mdx").flatMap((file) =>
          [
            ...readFileSync(path.join(contentRoot, `${file}.mdx`), "utf8").matchAll(
              /from "[^"]*\/assets\/(?<asset>[^"/]+)"/gu,
            ),
          ].map((match) => match.groups?.asset ?? ""),
        ),
      ),
    ].toSorted();

    expect(imported).toEqual(held);
  });
});

test.describe("documentation links resolve", () => {
  test("every documentation link names a manifest entry", () => {
    const unresolved = documentationLinks().filter(
      ({ href }) => !manifestHrefs.includes(href as never),
    );
    expect(unresolved).toEqual([]);
  });
});
