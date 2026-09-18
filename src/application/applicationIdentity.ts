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

/**
 * One organisation the caller may work as, in the two fields every consumer of the list reads: the
 * switcher labels its entries with them, and Home and dataset attachment name a project's
 * organisation with them. Nothing here carries membership, privacy or ancestry, because no
 * consumer of the visible list reads those.
 */
export type VisibleOrganisation = { id: string; name: string };

/**
 * Every organisation the caller may work as: the ones `GET /organisation` lists, then the default
 * organisation.
 *
 * The default organisation houses every personal unit and is public and readable by any authorised
 * caller, but membership of it is admin control, so it never appears in the caller's own index. A
 * caller whose only unit is personal would otherwise have no organisation in effect at all — an
 * empty switcher, and an index that filters their own project out.
 *
 * Two rules: the default organisation is *narrowed* rather than cast, because its own response
 * declares every field optional while consumers require an identity and a name, so one the server
 * did not fully name is dropped instead of coerced; and it is ordered last, because the switcher
 * auto-selects the first entry when nothing is chosen and a caller who later joins a real
 * organisation must not be stranded in their personal one.
 */
export const resolveVisibleOrganisations = (
  organisations: readonly VisibleOrganisation[] | undefined,
  defaultOrganisation: { id?: string; name?: string } | undefined,
): VisibleOrganisation[] => {
  const visible = (organisations ?? []).map(({ id, name }) => ({ id, name }));
  const { id, name } = defaultOrganisation ?? {};
  if (id === undefined || name === undefined || visible.some((entry) => entry.id === id)) {
    return visible;
  }
  return [...visible, { id, name }];
};

export const clearLegacyScopeStorage = (storage: Pick<Storage, "removeItem">) => {
  for (const key of LEGACY_SCOPE_STORAGE_KEYS) {
    storage.removeItem(key);
  }
};
