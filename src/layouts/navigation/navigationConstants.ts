import { type Route } from "nextjs-routes";

// Import Route type

// Use Route['pathname'] for type safety
export interface NavLinkData {
  title: string;
  path: Route["pathname"]; // Use specific route path type
  text: string;
}

// Centralized definition for navigation links
// The path strings should now be validated against Route['pathname']
export const NAV_LINKS: NavLinkData[] = [
  { title: "Datasets", path: "/datasets", text: "Datasets" },
  { title: "Project", path: "/project", text: "Project Data" },
  { title: "Run", path: "/run", text: "Apps/Jobs" },
  { title: "Results", path: "/results", text: "Results" },
];

// Centralized definition for query parameters to strip
export const NAV_PARAMS_TO_STRIP = ["taskId", "instanceId", "path"];
