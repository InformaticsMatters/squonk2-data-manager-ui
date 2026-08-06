import {
  evaluateRunLaunchCapability,
  type ProjectCapability,
  type ProjectRunFacts,
} from "./capabilities";
import { type ProjectFacts } from "./projectFacts";

export type RunCapabilities = {
  /** Running the definition being looked at, in the project the URL addresses. */
  launch: ProjectCapability;
};

/**
 * What the caller may do with one definition of the project in the URL. The facts are that
 * project's own resource, its subscription, the caller's account, the definition's own declared
 * availability, and whether the catalogue content could last be established — never a selected or
 * current project. `projectFacts.ts` remains the only place those project facts are gathered; this
 * only adds the definition the caller is looking at.
 */
export const resolveRunCapabilities = (
  facts: ProjectFacts,
  {
    content = "current",
    definitionUnavailability,
  }: { content?: "current" | "stale"; definitionUnavailability?: string } = {},
): RunCapabilities => {
  const runFacts: ProjectRunFacts = { ...facts, content, definitionUnavailability };

  return { launch: evaluateRunLaunchCapability(runFacts) };
};
