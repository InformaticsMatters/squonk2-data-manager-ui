import { type ComponentType } from "react";

import { type AdministrationRouteKind } from "../administration/routes";

export type ProjectSection =
  "create" | "deletion" | "files" | "index" | "manage" | "results" | "run";
export type DatasetSection = "detail" | "list" | "viewer";
/**
 * Administration composes one page per route kind, so its sections are exactly those kinds. The
 * unit workspace's four tabs and the subscription's two are sections in their own right rather than
 * views of one, which is what lets a malformed identifier fail locally inside the page addressed.
 */
export type AdministrationSection = AdministrationRouteKind;

export type PagePolicy =
  | { kind: "administration"; section: AdministrationSection }
  | { kind: "application" }
  | { kind: "datasets"; section: DatasetSection }
  | { kind: "projects"; section: ProjectSection }
  | { kind: "public" };

export type PolicyPage<Props = Record<string, never>> = ComponentType<Props> & {
  pagePolicy: PagePolicy;
};

/**
 * Declares which policy a page is composed under.
 *
 * The policy is written onto the component itself, so each page entry must hand in a component of
 * its own. Handing the same component to two entries would leave both pages carrying whichever
 * policy was evaluated last — and once a link has prefetched a sibling page, that is not the page
 * on screen, which resolves the URL against the wrong section and answers a valid route with a
 * not-found. That failure is silent, so it is refused here instead.
 */
export const withPagePolicy = <Props extends object>(
  pagePolicy: PagePolicy,
  Component: ComponentType<Props>,
): PolicyPage<Props> => {
  const declared = (Component as Partial<PolicyPage<Props>>).pagePolicy;
  if (declared && JSON.stringify(declared) !== JSON.stringify(pagePolicy)) {
    throw new Error("A page component cannot declare two page policies");
  }
  return Object.assign(Component, { pagePolicy });
};

export const withPublicPagePolicy = <Props extends object>(Component: ComponentType<Props>) =>
  withPagePolicy(pagePolicies.public, Component);

export const pagePolicies = {
  public: { kind: "public" } as const,
  application: { kind: "application" } as const,
  projects: (section: ProjectSection): Extract<PagePolicy, { kind: "projects" }> => ({
    kind: "projects",
    section,
  }),
  datasets: (section: DatasetSection): Extract<PagePolicy, { kind: "datasets" }> => ({
    kind: "datasets",
    section,
  }),
  administration: (
    section: AdministrationSection,
  ): Extract<PagePolicy, { kind: "administration" }> => ({ kind: "administration", section }),
};

/**
 * The layers every page is composed of, whatever it addresses: the outermost fallback for a broken
 * chrome, the route resolution the chrome reads, and the chrome itself. Everything a policy selects
 * is mounted beneath them, which is why a workspace or section change discards only content.
 */
const chromeLayers = ["chrome-error-boundary", "route-resolver", "layout"] as const;

type PublicComposition = {
  kind: "public";
  layers: readonly [...typeof chromeLayers, "public-shell", "content"];
};
type ApplicationComposition = {
  kind: "application";
  layers: readonly [
    ...typeof chromeLayers,
    "authentication",
    "api-client-ready",
    "application-shell",
    "content",
  ];
};
type FamilyComposition = {
  kind: "administration" | "datasets" | "projects";
  section: AdministrationSection | DatasetSection | ProjectSection;
  layers: readonly string[];
};

export type PageComposition = ApplicationComposition | FamilyComposition | PublicComposition;

export const resolvePageComposition = (policy: PagePolicy): PageComposition => {
  switch (policy.kind) {
    case "public":
      return { kind: "public", layers: [...chromeLayers, "public-shell", "content"] };
    case "application":
      return {
        kind: "application",
        layers: [
          ...chromeLayers,
          "authentication",
          "api-client-ready",
          "application-shell",
          "content",
        ],
      };
    case "projects":
    case "datasets":
    case "administration":
      return {
        kind: policy.kind,
        section: policy.section,
        layers: [
          ...chromeLayers,
          `${policy.kind}-route-gate`,
          "authentication",
          "api-client-ready",
          "application-shell",
          `${policy.kind}-error-boundary`,
          `${policy.kind}-suspense`,
          `${policy.kind}-shell`,
          "content",
        ],
      };
  }
};
