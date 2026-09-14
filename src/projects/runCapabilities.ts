import {
  evaluateRunLaunchCapability,
  type ProjectCapability,
  type ProjectRunFacts,
} from "./capabilities";
import { type ProjectFacts } from "./projectFacts";
import { type RunDefinitionItem, runDefinitionUnavailability } from "./runFacts";

export type RunCapabilities = {
  /**
   * Whether the Data Manager itself will run the version being looked at. It is stated in its own
   * right as well as folded into the launch, because a caller who also lacks authority is told
   * what they lack first and would otherwise never learn the version is unavailable at all.
   */
  availability: ProjectCapability;
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

  return {
    availability:
      definitionUnavailability === undefined
        ? { status: "enabled" }
        : { status: "disabled", reason: definitionUnavailability },
    launch: evaluateRunLaunchCapability(runFacts),
  };
};

/**
 * What the caller may do with each version of one definition. A card offers every version of its
 * definition and links to the one it is showing; the modal that link opens addresses the version the
 * URL names and asks here, so a version the Data Manager itself disabled is refused with its own
 * reason wherever that version is addressed.
 */
export const resolveDefinitionCapabilities =
  (facts: ProjectFacts, item: RunDefinitionItem, content: "current" | "stale") =>
  (definitionId: string): RunCapabilities =>
    resolveRunCapabilities(facts, {
      content,
      definitionUnavailability: runDefinitionUnavailability(item, definitionId),
    });
