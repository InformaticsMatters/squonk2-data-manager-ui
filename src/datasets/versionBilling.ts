import { type OrganisationUnitsGetResponse } from "@/api/account-server";
import {
  type DatasetVersionSummary,
  type InventoryDatasetDetail,
  type InventoryUserGetResponse,
} from "@/api/data-manager";

import { type FileTypeOptionsState } from "../components/uploads/types";
import { billingUnitLabel, billingUnitsOf } from "./uploadBilling";
import { type DatasetUploadInput } from "./useDatasetUploadCommands";

/**
 * One scope the generated user inventory may be asked about.
 *
 * The inventory answers for exactly one organisation or unit and refuses a caller who is not a
 * member of it, so an organisation the caller belongs to is asked once for all of its units, and a
 * unit is only addressed on its own where its organisation would refuse the question.
 */
export type DatasetInventoryScope =
  | { kind: "organisation"; organisationId: string }
  | { kind: "unit"; unitId: string };

export const datasetInventoryScopes = (
  groups: readonly OrganisationUnitsGetResponse[],
): DatasetInventoryScope[] =>
  groups.flatMap<DatasetInventoryScope>(({ organisation, units }) =>
    organisation.caller_is_member
      ? [{ kind: "organisation", organisationId: organisation.id }]
      : units
          .filter((unit) => unit.caller_is_member)
          .map((unit) => ({ kind: "unit", unitId: unit.id })),
  );

/**
 * The unit a dataset is billed to, as the generated inventory reports it.
 *
 * A dataset belongs to one unit for its whole life, so every version of it any user holds any role
 * in names the same unit. Reports that disagree describe a dataset this client has no single
 * billing ancestry for, which is a conflict to state rather than a unit to pick between.
 */
export type DatasetBillingAncestry =
  | { kind: "conflicting" }
  | { kind: "named"; unitId: string }
  | { kind: "unnamed" };

const heldDatasets = (report: InventoryUserGetResponse): InventoryDatasetDetail[] =>
  report.users.flatMap(({ datasets }) => [...(datasets.owner ?? []), ...(datasets.editor ?? [])]);

export const datasetBillingAncestry = (
  reports: readonly InventoryUserGetResponse[],
  datasetId: string,
): DatasetBillingAncestry => {
  const unitIds = new Set(
    reports
      .flatMap((report) => heldDatasets(report))
      .filter(({ id }) => id === datasetId)
      .map(({ unit_id }) => unit_id),
  );
  if (unitIds.size === 0) {
    return { kind: "unnamed" };
  }
  const [unitId] = unitIds;
  return unitIds.size === 1 ? { kind: "named", unitId } : { kind: "conflicting" };
};

/**
 * The billing unit a new version inherits, ready to be shown without being chosen.
 *
 * `label` is the caller's own index naming the unit and the organisation holding it; a unit that
 * index does not list keeps its own identity rather than losing it, exactly as an attachment target
 * degrades to what it can still state about itself.
 */
export type InheritedBillingUnit =
  | { kind: "pending" }
  | { kind: "resolved"; label: string; unitId: string }
  | { kind: "unresolved"; reason: string };

/**
 * What the inventory reads a version's billing rests on have told this client. A read still on its
 * way and a read that failed are different facts, because only one of them is going to answer on
 * its own; neither is an inventory that answered and named no unit.
 */
export type DatasetBillingReadState = "current" | "stale" | "unavailable";

/**
 * What a set of reads has told this client together. Anything still on its way keeps the whole
 * picture stale, because the answer may yet arrive; once nothing is still coming, a read that
 * failed is what makes the picture unreadable rather than complete.
 */
export const datasetBillingFreshness = (
  reads: readonly { answered: boolean; failed: boolean }[],
): DatasetBillingReadState => {
  if (reads.some(({ answered, failed }) => !answered && !failed)) {
    return "stale";
  }
  return reads.some(({ failed }) => failed) ? "unavailable" : "current";
};

const unnamedAncestry: Record<DatasetBillingReadState, InheritedBillingUnit> = {
  current: {
    kind: "unresolved",
    reason:
      "This dataset's billing unit could not be established, so a new version cannot be uploaded.",
  },
  stale: { kind: "pending" },
  unavailable: {
    kind: "unresolved",
    reason:
      "This dataset's billing unit could not be read, so a new version cannot be uploaded. Reload to try again.",
  },
};

export const resolveInheritedBillingUnit = ({
  ancestry,
  freshness,
  groups,
}: {
  ancestry: DatasetBillingAncestry;
  freshness: DatasetBillingReadState;
  groups: readonly OrganisationUnitsGetResponse[];
}): InheritedBillingUnit => {
  if (ancestry.kind === "conflicting") {
    return {
      kind: "unresolved",
      reason:
        "This dataset is reported against more than one unit, so a new version cannot be billed.",
    };
  }
  if (ancestry.kind === "unnamed") {
    return unnamedAncestry[freshness];
  }
  const named = billingUnitsOf(groups).find(({ unit }) => unit.id === ancestry.unitId);
  return {
    kind: "resolved",
    label: named ? billingUnitLabel(named) : ancestry.unitId,
    unitId: ancestry.unitId,
  };
};

/**
 * What a new version's upload sends. The Data Manager makes the successor of whichever dataset is
 * named, and a version is the same file under a new revision, so the retained filename and type are
 * the latest version's own rather than the dropped file's, and only the extra variables that type
 * asked for travel with it.
 */
export const versionUploadInput = ({
  datasetId,
  file,
  formatExtraVariables,
  parent,
  unitId,
}: {
  datasetId: string;
  file: File;
  formatExtraVariables?: FileTypeOptionsState;
  parent: DatasetVersionSummary;
  unitId: string;
}): DatasetUploadInput => {
  const extraVariables = formatExtraVariables?.[parent.type];
  return {
    datasetId,
    file,
    formatExtraVariables: extraVariables ? JSON.stringify(extraVariables) : undefined,
    mimeType: parent.type,
    name: parent.file_name,
    unitId,
  };
};
