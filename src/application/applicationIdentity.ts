export const APPLICATION_ORGANISATION_STORAGE_KEY = "data-manager-ui-current-organisation";

export const LEGACY_SCOPE_STORAGE_KEYS = [
  "data-manager-ui-current-project",
  "data-manager-ui-selected-files",
] as const;

export interface PersistedOrganisationIdentity {
  organisationId: string;
  version: 1;
}

export const parsePersistedOrganisationId = (value: unknown) => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("organisationId" in value) ||
    typeof value.organisationId !== "string" ||
    value.organisationId.length === 0
  ) {
    return undefined;
  }

  return value.organisationId;
};

export const clearLegacyScopeStorage = (storage: Pick<Storage, "removeItem">) => {
  for (const key of LEGACY_SCOPE_STORAGE_KEYS) {
    storage.removeItem(key);
  }
};
