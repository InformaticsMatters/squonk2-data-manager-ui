export const RECENT_PROJECTS_STORAGE_KEY = "data-manager-ui-recent-projects";

const MAX_RECENT_PROJECTS = 3;

export const parseRecentProjectIds = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(value.filter((item): item is string => typeof item === "string" && !!item)),
  ].slice(0, MAX_RECENT_PROJECTS);
};

export const readRecentProjectIds = (storage: Pick<Storage, "getItem">) => {
  try {
    const value = storage.getItem(RECENT_PROJECTS_STORAGE_KEY);
    return value === null ? [] : parseRecentProjectIds(JSON.parse(value));
  } catch {
    return [];
  }
};

/** The answer a render that has no browser storage to read is given. */
export const noRecentProjectIds: readonly string[] = [];

let lastReadRecentProjects: string | null | undefined;
let lastRecentProjectIds: readonly string[] = noRecentProjectIds;

/**
 * The recent projects as a value that stays identical for as long as browser storage does.
 *
 * `readRecentProjectIds` answers with a fresh array every call, which a render may not depend on.
 * This caches that answer against the text it was parsed from, so the list can be read during
 * render — by `useSyncExternalStore`, or by anything else that must not copy it into state.
 */
export const recentProjectIdsSnapshot = (storage: Pick<Storage, "getItem">) => {
  let raw: string | null;
  try {
    raw = storage.getItem(RECENT_PROJECTS_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== lastReadRecentProjects) {
    lastReadRecentProjects = raw;
    lastRecentProjectIds = readRecentProjectIds(storage);
  }
  return lastRecentProjectIds;
};

export const recordRecentProject = (
  storage: Pick<Storage, "getItem" | "setItem">,
  projectId: string,
) => {
  const ids = [projectId, ...readRecentProjectIds(storage).filter((id) => id !== projectId)].slice(
    0,
    MAX_RECENT_PROJECTS,
  );
  storage.setItem(RECENT_PROJECTS_STORAGE_KEY, JSON.stringify(ids));
};

export const removeRecentProject = (
  storage: Pick<Storage, "getItem" | "setItem">,
  projectId: string,
) => {
  const ids = readRecentProjectIds(storage).filter((id) => id !== projectId);
  storage.setItem(RECENT_PROJECTS_STORAGE_KEY, JSON.stringify(ids));
};
