import { useGetOrganisations } from "@/api/account-server/organisation";
import { useGetUnits } from "@/api/account-server/unit";

import {
  resolveOrganisationAuthorityFacts,
  type UnitCreationFacts,
} from "../application/organisationUnits";
import { useAccountFacts } from "./useAccountFacts";

/**
 * The facts a unit-creation offer for one organisation is decided from, assembled from the
 * generated resources that declare them.
 *
 * It sits above the route families for the same reason the rules it feeds do: Administration and
 * Projects both offer unit creation, and neither may reach into the other's implementation.
 */
export const useUnitCreationFacts = (organisationId: string | undefined): UnitCreationFacts => {
  const account = useAccountFacts();
  const { data: organisations } = useGetOrganisations();
  const { data: unitGroups } = useGetUnits();

  return {
    ...account,
    organisation: resolveOrganisationAuthorityFacts(
      organisationId,
      organisations?.organisations,
      unitGroups?.units,
    ),
    organisationId,
  };
};
