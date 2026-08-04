import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";
import {
  useGetDefaultOrganisation,
  useGetOrganisationsSuspense,
} from "@/api/account-server/organisation";
import { useGetPersonalUnit, useGetUnitsSuspense } from "@/api/account-server/unit";
import { useGetUserAccount } from "@/api/account-server/user";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { type AccessCaller, type AccessFactsFreshness } from "./capabilities";

export type UnitWithOrganisation = { organisation: OrganisationAllDetail; unit: UnitAllDetail };

export type AccessFacts = {
  caller: AccessCaller;
  defaultOrganisationId?: string;
  freshness: AccessFactsFreshness;
  personalUnitId?: string;
};

const flattenUnits = (groups: OrganisationUnitsGetResponse[]): UnitWithOrganisation[] =>
  groups.flatMap(({ organisation, units }) => units.map((unit) => ({ organisation, unit })));

export const useAccessIndex = () => {
  const { data: organisations } = useGetOrganisationsSuspense();
  const { data: unitGroups } = useGetUnitsSuspense();
  return { organisations: organisations.organisations, units: flattenUnits(unitGroups.units) };
};

/**
 * Resolves caller authority, personal-unit identity, and default-organisation identity from their
 * own generated resources. Facts stay `stale` until every resource answers, so capabilities defer
 * to server authority rather than guessing from organisation or unit names.
 */
export const useAccessFacts = (): AccessFacts => {
  const account = useGetUserAccount({ query: { retry: false } });
  const defaultOrganisation = useGetDefaultOrganisation({ query: { retry: false } });
  const personalUnit = useGetPersonalUnit({ query: { retry: false } });
  const personalUnitIsAbsent =
    personalUnit.isError && classifyTransportFailure(personalUnit.error).kind === "not-found";
  const resolved =
    account.isSuccess &&
    defaultOrganisation.isSuccess &&
    (personalUnit.isSuccess || personalUnitIsAbsent);

  return {
    caller: {
      isPlatformAdministrator: account.data?.caller_has_admin_privilege ?? false,
      username: account.data?.user.id,
    },
    defaultOrganisationId: defaultOrganisation.data?.id,
    freshness: resolved ? "current" : "stale",
    personalUnitId: personalUnit.data?.id,
  };
};
