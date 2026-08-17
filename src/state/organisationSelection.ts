import { useCallback, useEffect } from "react";

import { type OrganisationDetail } from "@/api/account-server";
import { useGetOrganisation } from "@/api/account-server/organisation";

import { atom, useAtom } from "jotai";

import {
  APPLICATION_ORGANISATION_STORAGE_KEY,
  clearLegacyScopeStorage,
  parsePersistedOrganisationId,
  type PersistedOrganisationIdentity,
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
    (next: OrganisationDetail | undefined) => {
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
