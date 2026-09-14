import { type Route } from "nextjs-routes";

/**
 * A URL this application serves that takes no parameters. Every documentation page is one, and
 * spelling that here is what lets a manifest href be handed straight to a link.
 */
export type DocsRoute = Exclude<Route, { query: unknown }>["pathname"];

/**
 * The documentation tree, owned in one place.
 *
 * Every consumer of the tree reads it from here: the sidebar, the `/docs` and `/docs/how-to` index
 * pages, the home page's documentation list, and the breadcrumb and prev/next of each page. Before
 * this, the tree was hand-copied into three of those, which is how a page came to be served at a
 * URL nothing linked while its near-identical twin was linked from somewhere else.
 *
 * The union of hrefs this exports is what `withDocsPage` takes as its key, so a documentation page
 * whose URL is not an entry here does not compile.
 */

/**
 * One page of the tree, and the pages beneath it.
 *
 * The href is a route this application serves rather than a bare string, so an entry naming a URL
 * no page entry answers is a compile error rather than a link that 404s.
 */
export interface DocsManifestNode {
  href: DocsRoute;
  /** The page's own name, used as its link text, its breadcrumb and its `<title>`. */
  title: string;
  /** One line saying what the page is for, shown beside its title in every index that lists it. */
  blurb: string;
  children: readonly DocsManifestNode[];
}

/**
 * The tree mirrors the application: a guide per workspace, and beneath the project workspace a
 * guide per section. A guide that cannot be pointed at a screen is a guide that drifts unnoticed.
 */
export const docsManifest = {
  href: "/docs",
  title: "Documentation",
  blurb: "Concepts, a guided tour, and how-to guides for the Squonk Data Manager.",
  children: [
    {
      href: "/docs/concepts",
      title: "Concepts",
      blurb: "Organisations, units, projects, datasets and what they cost.",
      children: [],
    },
    {
      href: "/docs/guided-tour",
      title: "Guided tour",
      blurb: "A walk through the application from logging in to reading a result.",
      children: [],
    },
    {
      href: "/docs/how-to",
      title: "How-to guides",
      blurb: "One guide per workspace, and one per section of a project.",
      children: [
        {
          href: "/docs/how-to/login",
          title: "Logging in",
          blurb: "Authenticating with Keycloak, and logging out again.",
          children: [],
        },
        {
          href: "/docs/how-to/getting-started",
          title: "Getting started",
          blurb: "Your first project, and the shell you will work in.",
          children: [],
        },
        {
          href: "/docs/how-to/projects",
          title: "Projects",
          blurb: "Finding a project, creating one, and the roles people hold in it.",
          children: [
            {
              href: "/docs/how-to/projects/files",
              title: "Files",
              blurb: "Browsing, uploading and viewing a project's files.",
              children: [],
            },
            {
              href: "/docs/how-to/projects/run",
              title: "Run",
              blurb: "Launching workflows, applications and jobs.",
              children: [],
            },
            {
              href: "/docs/how-to/projects/results",
              title: "Results",
              blurb: "Following what you have launched, and running it again.",
              children: [],
            },
            {
              href: "/docs/how-to/projects/manage",
              title: "Manage",
              blurb: "Roles, privacy, coin usage, and deleting a project.",
              children: [],
            },
          ],
        },
        {
          href: "/docs/how-to/datasets",
          title: "Datasets",
          blurb: "Uploading datasets, versioning them, and attaching them to a project.",
          children: [],
        },
        {
          href: "/docs/how-to/administration",
          title: "Administration",
          blurb: "Organisations, units, subscriptions, charges and usage reports.",
          children: [],
        },
      ],
    },
    {
      href: "/docs/jobs",
      title: "Deployed jobs",
      blurb: "What a job is, and where this deployment's jobs are listed.",
      children: [],
    },
    {
      href: "/docs/developer",
      title: "Developer documentation",
      blurb: "The components of a Squonk 2 deployment, and its APIs and clients.",
      children: [],
    },
  ],
} as const satisfies DocsManifestNode;

type HrefsOfNode<TNode> = TNode extends { children: infer TChildren; href: infer THref }
  ? HrefsOfList<TChildren> | THref
  : never;
type HrefsOfList<TList> = TList extends readonly (infer TNode)[] ? HrefsOfNode<TNode> : never;

/** Every URL the documentation tree owns. A page addressed by anything else does not compile. */
export type DocsHref = HrefsOfNode<typeof docsManifest>;

/** One entry of the tree, alongside the ancestors that lead to it. */
export interface DocsEntry {
  node: DocsManifestNode;
  /** From the root down to, but excluding, the entry itself. */
  ancestors: readonly DocsManifestNode[];
}

/** Every entry of the tree in reading order — the order an index lists them and prev/next walks. */
export const docsEntries = (): readonly DocsEntry[] => {
  const walk = (
    node: DocsManifestNode,
    ancestors: readonly DocsManifestNode[],
  ): readonly DocsEntry[] => [
    { ancestors, node },
    ...node.children.flatMap((child) => walk(child, [...ancestors, node])),
  ];

  return walk(docsManifest, []);
};

/** The entry one URL names, or `undefined` where the tree does not own that URL. */
export const docsEntry = (href: DocsRoute): DocsEntry | undefined =>
  docsEntries().find((entry) => entry.node.href === href);

/**
 * The entry one URL names, with its ancestors. Callers holding a `DocsHref` have already been
 * checked by the compiler, so this reports the tree's own inconsistency rather than returning a
 * page with no title.
 */
export const docsEntryOf = (href: DocsHref): DocsEntry => {
  const entry = docsEntry(href);
  if (!entry) {
    throw new Error(`The documentation manifest has no entry for ${href}`);
  }
  return entry;
};

/** The node one URL names. */
export const docsNode = (href: DocsHref): DocsManifestNode => docsEntryOf(href).node;

/** The page before and after this one, walking the tree in the order an index reads it. */
export const docsSiblings = (
  href: DocsHref,
): { next: DocsManifestNode | undefined; previous: DocsManifestNode | undefined } => {
  const entries = docsEntries();
  const index = entries.findIndex((entry) => entry.node.href === href);

  return {
    next: entries[index + 1]?.node,
    previous: index > 0 ? entries[index - 1].node : undefined,
  };
};
