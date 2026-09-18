import { useGetOrganisations } from "@/api/account-server/organisation";

import { useSelectedOrganisation, useVisibleOrganisations } from "../state/organisationSelection";

/**
 * The organisation the Administration workspace is scoped to, which is the one named in the
 * masthead and nothing else.
 *
 * Administration reads and writes the application's one organisation identity through this module
 * alone, so the workspace has a single place where the masthead is consulted and a single place
 * where it is set. Creating an organisation and following a link into another one are the only two
 * things that set it; everything else only reads it.
 *
 * `pending` and `none` are told apart deliberately. A caller who has simply not been given an
 * organisation yet — the masthead adopts the first visible one on mount — must not be shown the
 * page that says they have none.
 */
export type OrganisationInEffect =
  | { kind: "none" }
  | { kind: "organisation"; name?: string; organisationId: string }
  | { kind: "pending" };

export const useOrganisationInEffect = (): OrganisationInEffect => {
  const [organisation, , organisationId] = useSelectedOrganisation();
  const visible = useVisibleOrganisations();
  // The caller's own organisation index orders the visible list, so nothing is settled until it has
  // answered — including when it answers by failing, which is an empty index rather than a pending
  // one.
  const { isPending } = useGetOrganisations();

  if (organisationId === undefined) {
    return isPending || visible.length > 0 ? { kind: "pending" } : { kind: "none" };
  }
  return {
    kind: "organisation",
    // The visible list names every organisation the caller may work as, including the default one
    // whose addressed read an ordinary caller is refused. The detail read only completes a name
    // that list could not supply.
    name: visible.find((candidate) => candidate.id === organisationId)?.name ?? organisation?.name,
    organisationId,
  };
};

/**
 * Sets the organisation in effect. The two callers are organisation creation, which switches to the
 * organisation it just made, and a unit link followed into an organisation the caller's own grouped
 * index names.
 */
export const useAdoptOrganisation = () => {
  const [, setOrganisation] = useSelectedOrganisation();
  return setOrganisation;
};
