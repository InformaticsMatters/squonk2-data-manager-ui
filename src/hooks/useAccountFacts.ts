import { useGetDefaultOrganisation } from "@/api/account-server/organisation";
import { useGetUserAccount } from "@/api/account-server/user";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import {
  type UnitCreationCaller,
  type UnitCreationFreshness,
} from "../application/organisationUnits";
import { useGetPersonalUnit } from "./useGetPersonalUnit";

/**
 * Who the caller is, and which resources the Account Server has named as their own.
 *
 * This sits above the route families because more than one of them asks it: Administration's
 * organisation and unit screens know it as `useAccessFacts`, and Projects reads it to decide the
 * unit offer it makes beside **Create project**. A second assembly of the same reads is how two
 * screens come to disagree about who the caller is.
 *
 * Facts stay `stale` until every read has answered, so capabilities defer to server authority
 * rather than guessing from organisation or unit names.
 */
export type AccountFacts = {
  caller: UnitCreationCaller;
  defaultOrganisationId?: string;
  freshness: UnitCreationFreshness;
  personalUnitId?: string;
};

export const useAccountFacts = (): AccountFacts => {
  const account = useGetUserAccount({ query: { retry: false } });
  const defaultOrganisation = useGetDefaultOrganisation({ query: { retry: false } });
  const personalUnit = useGetPersonalUnit();
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
