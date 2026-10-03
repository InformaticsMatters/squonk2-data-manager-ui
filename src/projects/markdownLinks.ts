import { canonicalFilesystemPath, filesystemPathOf } from "./fileFacts";
import { fileViewersFor } from "./fileViewers";
import { projectFileTransportLinks, projectLinks } from "./routes";

/** Where one link inside a Markdown file goes, and whether that is outside the application. */
type MarkdownLink = { external: boolean; href: string };

const externalLink = /^(?:https?|mailto):/iu;
const scheme = /^[a-z][\d+.a-z-]*:/iu;

/**
 * The project path a relative or absolute reference names, read the way a browser reads one: from
 * the root when it starts with `/`, otherwise from the directory holding the Markdown file. A
 * fragment or query is dropped, since a project file has neither. `null` is a reference that names
 * nothing in the project — one that climbs above the root, has a scheme, or cannot be decoded.
 */
const resolveProjectPath = (
  directory: string,
  reference: string,
): { isDirectory: boolean; path: string } | null => {
  if (scheme.test(reference)) {
    return null;
  }
  const raw = reference.replace(/[#?].*$/u, "");
  if (raw === "") {
    return null;
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  const names = decoded.startsWith("/") ? [] : directory.split("/").filter(Boolean);
  const segments = decoded.split("/");
  for (const segment of segments) {
    if (segment === "..") {
      if (names.pop() === undefined) {
        return null;
      }
    } else if (segment !== "" && segment !== ".") {
      names.push(segment);
    }
  }
  const path = canonicalFilesystemPath(filesystemPathOf(names));
  const last = segments.at(-1);
  return path === null
    ? null
    : { isDirectory: path === "/" || last === "" || last === "." || last === "..", path };
};

/**
 * Where a link inside a Markdown file goes, or `null` for one shown as plain text. A web or mail
 * address leaves the application; anything else names a project file or directory relative to
 * `directory`, the directory holding the Markdown file, and opens it in the project's own Files
 * routes — another Markdown file in the Markdown Viewer, any other file in its default viewer, and
 * a reference ending in `/` as a directory.
 */
export const resolveMarkdownHref = (
  projectId: string,
  directory: string,
  href: string,
): MarkdownLink | null => {
  if (externalLink.test(href)) {
    return { external: true, href };
  }
  const target = resolveProjectPath(directory, href);
  if (target === null) {
    return null;
  }
  const { path } = target;
  return {
    external: false,
    href: target.isDirectory
      ? projectLinks.files(projectId, { path })
      : projectLinks.fileView(projectId, {
          path,
          viewer: fileViewersFor(path).includes("markdown") ? "markdown" : undefined,
        }),
  };
};

/**
 * Where an image inside a Markdown file loads from, or `null` for one not shown. Only a project file
 * loads, through the viewer proxy, resolved as `resolveMarkdownHref` does: a web image would let the
 * file report whoever views it to a third party.
 */
export const resolveMarkdownImageSrc = (
  projectId: string,
  directory: string,
  src: string,
): string | null => {
  const target = resolveProjectPath(directory, src);
  return target === null || target.isDirectory
    ? null
    : projectFileTransportLinks.browserView(projectId, target.path);
};
