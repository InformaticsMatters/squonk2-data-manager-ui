import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

export type DatasetCapability =
  | { status: "disabled"; reason: string }
  | { status: "enabled"; reason?: string }
  | { status: "hidden" };

type DatasetCapabilityFacts = {
  caller: { username?: string };
  dataset: DatasetSummary;
  version: DatasetVersionSummary;
  facts?: "current" | "missing" | "stale";
};

const evaluateDatasetEditAuthority = ({
  caller,
  dataset,
  version,
  facts = "current",
}: DatasetCapabilityFacts): DatasetCapability => {
  if (facts !== "current" || !caller.username) {
    return {
      status: "enabled",
      reason: "Your permission will be confirmed when you use this action.",
    };
  }
  if (version.owner === caller.username || dataset.editors.includes(caller.username)) {
    return { status: "enabled" };
  }
  return { status: "disabled", reason: "You must be an owner or editor of this dataset." };
};

export const evaluateDatasetLabelCapability = (facts: DatasetCapabilityFacts): DatasetCapability =>
  evaluateDatasetEditAuthority(facts);

export const evaluateDatasetEditorCapability = (
  facts: DatasetCapabilityFacts,
): DatasetCapability => {
  const authority = evaluateDatasetEditAuthority(facts);
  if (authority.status !== "enabled" || (facts.facts !== undefined && facts.facts !== "current")) {
    return authority;
  }
  if (facts.version.processing_stage !== "DONE") {
    return {
      status: "disabled",
      reason: "Editors cannot be changed until this dataset upload is complete.",
    };
  }
  return authority;
};

export const evaluateDatasetDeletionCapability = (
  facts: DatasetCapabilityFacts,
): DatasetCapability => {
  const authority = evaluateDatasetEditAuthority(facts);
  if (authority.status !== "enabled" || (facts.facts !== undefined && facts.facts !== "current")) {
    return authority;
  }
  const deletableStages: readonly DatasetVersionSummary["processing_stage"][] = [
    "DONE",
    "FAILED",
    "FORMATTING",
    "LOADING",
  ];
  if (!deletableStages.includes(facts.version.processing_stage)) {
    return { status: "disabled", reason: "This version is not currently available for deletion." };
  }
  return authority;
};

export const evaluatePlatformDatasetAction = (
  isPlatformAdministrator: boolean,
): DatasetCapability => (isPlatformAdministrator ? { status: "enabled" } : { status: "hidden" });
