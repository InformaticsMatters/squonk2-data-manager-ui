import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

export type DatasetCapability =
  | { status: "disabled"; reason: string }
  | { status: "enabled"; reason?: string }
  | { status: "hidden" };

export type DatasetFactsFreshness = "current" | "missing" | "stale";

type DatasetCapabilityFacts = {
  caller: { username?: string };
  dataset: DatasetSummary;
  version: DatasetVersionSummary;
  freshness?: DatasetFactsFreshness;
};

const evaluateDatasetEditAuthority = ({
  caller,
  dataset,
  version,
  freshness = "current",
}: DatasetCapabilityFacts): DatasetCapability => {
  if (freshness !== "current" || !caller.username) {
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
  if (
    authority.status !== "enabled" ||
    (facts.freshness !== undefined && facts.freshness !== "current")
  ) {
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
  if (
    authority.status !== "enabled" ||
    (facts.freshness !== undefined && facts.freshness !== "current")
  ) {
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

/**
 * Whether a new dataset can be uploaded at all.
 *
 * Upload stays visible whatever the caller's memberships are, because its absence would leave no
 * way to learn what is missing. An unanswered or failed unit index says the membership is still
 * unconfirmed rather than claiming there are no units, which is a different fact and only knowable
 * once the index has actually answered.
 */
export const evaluateDatasetUploadCapability = ({
  eligibleUnitCount,
  freshness = "current",
}: {
  eligibleUnitCount: number;
  freshness?: "current" | "stale";
}): Exclude<DatasetCapability, { status: "hidden" }> => {
  if (freshness !== "current") {
    return { status: "disabled", reason: "Unit membership is still being confirmed." };
  }
  return eligibleUnitCount > 0
    ? { status: "enabled" }
    : {
        status: "disabled",
        reason:
          "You must be a member of a unit to upload a dataset. Ask a unit member to add you in Administration.",
      };
};

/**
 * Whether this dataset version can be attached to a project at all.
 *
 * Attachment stays visible whatever the caller can edit, because its absence would leave no way to
 * learn what is missing. Membership that has not answered — or could not — says the eligible
 * targets are still unconfirmed rather than that there are none, which is a different fact.
 */
export const evaluateDatasetAttachmentCapability = ({
  eligibleTargetCount,
  freshness = "current",
}: {
  eligibleTargetCount: number;
  freshness?: "current" | "stale";
}): Exclude<DatasetCapability, { status: "hidden" }> => {
  if (freshness !== "current") {
    return { status: "disabled", reason: "Project membership is still being confirmed." };
  }
  return eligibleTargetCount > 0
    ? { status: "enabled" }
    : {
        status: "disabled",
        reason:
          "You must be an editor or administrator of a project to attach a dataset. Ask a project administrator to add you to one.",
      };
};

export const evaluatePlatformDatasetAction = (
  isPlatformAdministrator: boolean,
): DatasetCapability => (isPlatformAdministrator ? { status: "enabled" } : { status: "hidden" });
