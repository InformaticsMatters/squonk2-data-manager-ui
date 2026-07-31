import { type ComponentType } from "react";

export type ProjectSection =
  | "create"
  | "deletion"
  | "files"
  | "index"
  | "manage"
  | "results"
  | "run";
export type DatasetSection = "detail" | "list" | "viewer";
export type AdministrationSection =
  | "charges"
  | "organisation-access"
  | "subscriptions"
  | "usage-inventory";

export type PagePolicy =
  | { kind: "administration"; section: AdministrationSection }
  | { kind: "application" }
  | { kind: "datasets"; section: DatasetSection }
  | { kind: "projects"; section: ProjectSection }
  | { kind: "public" };

export type PolicyPage<Props = Record<string, never>> = ComponentType<Props> & {
  pagePolicy: PagePolicy;
};

export const withPagePolicy = <Props extends object>(
  pagePolicy: PagePolicy,
  Component: ComponentType<Props>,
): PolicyPage<Props> => Object.assign(Component, { pagePolicy });

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

type PublicComposition = { kind: "public"; layers: readonly ["public-shell", "content"] };
type ApplicationComposition = {
  kind: "application";
  layers: readonly ["authentication", "api-client-ready", "application-shell", "content"];
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
      return { kind: "public", layers: ["public-shell", "content"] };
    case "application":
      return {
        kind: "application",
        layers: ["authentication", "api-client-ready", "application-shell", "content"],
      };
    case "projects":
    case "datasets":
    case "administration":
      return {
        kind: policy.kind,
        section: policy.section,
        layers: [
          "authentication",
          "api-client-ready",
          `${policy.kind}-error-boundary`,
          `${policy.kind}-suspense`,
          "application-shell",
          `${policy.kind}-shell`,
          "content",
        ],
      };
  }
};
