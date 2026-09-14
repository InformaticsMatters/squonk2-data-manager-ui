import { type UnitAllDetail } from "@/api/account-server";
import { useGetOrganisationUnitsSuspense } from "@/api/account-server/unit";
import { useGetUserInventory } from "@/api/data-manager/inventory";

import { retryAdministrationRead } from "./accessFacts";
import { administrationReadIsAuthoritative } from "./failures";
import {
  classifyInventoryRead,
  type InventoryProjectRow,
  type InventoryRead,
  mapInventoryRead,
  type OrganisationInventoryRow,
  organisationInventoryRows,
  pivotInventoryByProject,
  type UnitInventoryRow,
  unitInventoryRows,
} from "./inventoryFacts";

/**
 * A confirmed refusal or absence is the report's own answer, so it is presented where the report
 * is. Anything else is worth repeating, and only reaches the task's retry boundary while there is
 * no readable report to keep: once one has been read, a failed refresh leaves it on screen.
 */
const reportQuery = {
  retry: retryAdministrationRead,
  throwOnError: (error: unknown, query: { state: { data: unknown } }) =>
    !administrationReadIsAuthoritative(error) && query.state.data === undefined,
};

/** A report and the way to ask for it again, which never changes the resource being reported on. */
export type UsageInventoryReport<TReport> = { read: InventoryRead<TReport>; refresh: () => void };

export const useOrganisationInventory = (
  organisationId: string,
): UsageInventoryReport<OrganisationInventoryRow[]> => {
  // The addressed organisation answers for its own units, so a unit of it the caller can read
  // without being a member of still accounts for the users working in it.
  const { data: group } = useGetOrganisationUnitsSuspense(organisationId);
  const query = useGetUserInventory({ org_id: organisationId }, { query: reportQuery });

  return {
    read: mapInventoryRead(classifyInventoryRead(query), (inventory) =>
      organisationInventoryRows({ inventory, units: group.units }),
    ),
    refresh: () => void query.refetch(),
  };
};

/** Both pivots come from one read, so a unit report never shows two disagreeing inventories. */
export type UnitInventoryReport = { projects: InventoryProjectRow[]; users: UnitInventoryRow[] };

export const useUnitInventory = (
  unit: UnitAllDetail,
): UsageInventoryReport<UnitInventoryReport> => {
  const query = useGetUserInventory({ unit_id: unit.id }, { query: reportQuery });

  return {
    read: mapInventoryRead(classifyInventoryRead(query), (inventory) => ({
      projects: pivotInventoryByProject(inventory.users),
      users: unitInventoryRows({ inventory, unit }),
    })),
    refresh: () => void query.refetch(),
  };
};
