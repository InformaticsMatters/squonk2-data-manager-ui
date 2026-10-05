import { useMemo } from "react";

import { type OrganisationUnitsGetResponse } from "@/api/account-server";
import { useGetUnits } from "@/api/account-server/unit";
import { getGetUserInventorySuspenseQueryOptions } from "@/api/data-manager/inventory";

import { useQueries } from "@tanstack/react-query";

import {
  datasetBillingAncestry,
  datasetBillingFreshness,
  datasetInventoryScopes,
  type InheritedBillingUnit,
  resolveInheritedBillingUnit,
} from "./versionBilling";

/** The inventory reads that say which unit holds a dataset: one per scope the caller may ask about. */
export const datasetInventoryReads = (groups: readonly OrganisationUnitsGetResponse[]) =>
  datasetInventoryScopes(groups).map((scope) =>
    getGetUserInventorySuspenseQueryOptions(
      scope.kind === "organisation" ? { org_id: scope.organisationId } : { unit_id: scope.unitId },
      { query: { retry: false } },
    ),
  );

/**
 * The billing unit a new version of this dataset inherits.
 *
 * A dataset version carries no unit of its own, so the unit is read from the generated user
 * inventory — the only generated resource that reports which unit holds a dataset — and named from
 * the generated organisation/unit index. Nothing here reads selected unit or organisation state, so
 * the unit a version is billed to is the dataset's own whatever the rest of the shell is showing.
 *
 * The inventory answers per organisation or unit and refuses anything else, so it is asked once per
 * scope the caller may ask about. A scope that failed is not an answer: it leaves the facts stale
 * rather than claiming the dataset belongs nowhere.
 */
export const useDatasetVersionBilling = (datasetId: string): InheritedBillingUnit => {
  const { data, isError, isPending } = useGetUnits();
  const groups = useMemo(() => data?.units ?? [], [data]);
  const reports = useQueries({ queries: useMemo(() => datasetInventoryReads(groups), [groups]) });

  const answered = reports.flatMap((report) => (report.data ? [report.data] : []));
  // The unit index answers for which scopes exist at all, so its own read counts with theirs.
  const reads = [
    { answered: !isPending && !isError, failed: isError },
    ...reports.map((report) => ({ answered: !!report.data, failed: report.isError })),
  ];

  return resolveInheritedBillingUnit({
    ancestry: datasetBillingAncestry(answered, datasetId),
    freshness: datasetBillingFreshness(reads),
    groups,
  });
};
