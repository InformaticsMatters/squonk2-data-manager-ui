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
