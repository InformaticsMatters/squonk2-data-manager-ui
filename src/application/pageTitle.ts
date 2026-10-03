import { projectSectionLabel } from "../projects/routes";
import {
  type AdministrationSection,
  type DatasetSection,
  type PagePolicy,
  type ProjectSection,
} from "./pagePolicy";

const applicationName = "Squonk Data Manager";

/**
 * A document title, most specific part first and the application last, so a narrow tab still shows
 * which page it is (WCAG technique G88).
 */
export const formatPageTitle = (parts: readonly string[]) =>
  [...parts, applicationName].join(" | ");

const projectTitles: Record<ProjectSection, readonly string[]> = {
  create: ["New project", "Projects"],
  deletion: ["Deleting project", "Projects"],
  files: [projectSectionLabel("files"), "Projects"],
  index: ["Projects"],
  manage: [projectSectionLabel("manage"), "Projects"],
  results: [projectSectionLabel("results"), "Projects"],
  run: [projectSectionLabel("run"), "Projects"],
};

const datasetTitles: Record<DatasetSection, readonly string[]> = {
  detail: ["Dataset", "Datasets"],
  list: ["Datasets"],
  viewer: ["Viewer", "Datasets"],
};

const administrationTitles: Record<AdministrationSection, readonly string[]> = {
  "organisation-charges": ["Charges", "Administration"],
  "organisation-usage": ["Usage & Inventory", "Administration"],
  overview: ["Administration"],
  subscription: ["Subscription", "Administration"],
  "subscription-charges": ["Subscription charges", "Administration"],
  "subscription-entry": ["Subscription", "Administration"],
  "unit-access": ["Access", "Administration"],
  "unit-charges": ["Unit charges", "Administration"],
  "unit-subscriptions": ["Subscriptions", "Administration"],
  "unit-usage": ["Usage & Inventory", "Administration"],
};

/**
 * The title every page gets from its policy alone. A page that knows something more specific, such
 * as the file it shows, replaces it with a later `<title>`.
 */
export const policyTitle = (policy: PagePolicy): readonly string[] => {
  switch (policy.kind) {
    case "public":
    case "application":
      return [];
    case "projects":
      return projectTitles[policy.section];
    case "datasets":
      return datasetTitles[policy.section];
    case "administration":
      return administrationTitles[policy.section];
  }
};
