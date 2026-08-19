import { useCallback, useEffect, useMemo } from "react";

import {
  useGetDefaultOrganisation,
  useGetOrganisation,
  useGetOrganisations,
} from "@/api/account-server/organisation";

import { atom, useAtom } from "jotai";

import {
  APPLICATION_ORGANISATION_STORAGE_KEY,
  clearLegacyScopeStorage,
  parsePersistedOrganisationId,
  type PersistedOrganisationIdentity,
  resolveVisibleOrganisations,
  type VisibleOrganisation,
} from "../application/applicationIdentity";

export const organisationIdAtom = atom<string | undefined>(undefined);

const readPersistedOrganisationId = () => {
  try {
    const value = localStorage.getItem(APPLICATION_ORGANISATION_STORAGE_KEY);
    return value === null ? undefined : parsePersistedOrganisationId(JSON.parse(value));
  } catch {
    return undefined;
  }
};

/**
 * Every organisation this caller may work as. The two reads are joined by the pure resolver rather
 * than by any screen, so the switcher, Home and dataset attachment cannot disagree about which
 * organisations exist — in particular about the default organisation, which houses every personal
 * unit and which `GET /organisation` never lists.
 */
export const useVisibleOrganisations = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { data: organisations } = useGetOrganisations(undefined, { query: { enabled } });
  // The default organisation is absent rather than exceptional for a deployment that has none, so
  // its read is never retried into a failure the caller has to see.
  const { data: defaultOrganisation } = useGetDefaultOrganisation({
    query: { enabled, retry: false },
  });

  return useMemo(
    () => resolveVisibleOrganisations(organisations?.organisations, defaultOrganisation),
    [defaultOrganisation, organisations],
  );
};

export const useSelectedOrganisation = () => {
  const [organisationId, setOrganisationId] = useAtom(organisationIdAtom);
  const { data: organisation } = useGetOrganisation(organisationId ?? "", {
    query: { enabled: !!organisationId },
  });

  useEffect(() => {
    clearLegacyScopeStorage(localStorage);
    setOrganisationId((current) => current ?? readPersistedOrganisationId());
  }, [setOrganisationId]);

  const setOrganisation = useCallback(
    (next: Pick<VisibleOrganisation, "id"> | undefined) => {
      const nextId = next?.id;
      setOrganisationId(nextId);
      if (nextId) {
        const value: PersistedOrganisationIdentity = { organisationId: nextId, version: 1 };
        localStorage.setItem(APPLICATION_ORGANISATION_STORAGE_KEY, JSON.stringify(value));
      } else {
        localStorage.removeItem(APPLICATION_ORGANISATION_STORAGE_KEY);
      }
    },
    [setOrganisationId],
  );

  return [organisation, setOrganisation, organisationId] as const;
};
