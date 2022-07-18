const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LOCAL_STORAGE_PREFIX = process.env.NEXT_PUBLIC_LOCAL_STORAGE_PREFIX ?? "data-manager-ui";

export const DM_API_URL = BASE_PATH + "/api/dm-api";
export const AS_API_URL = BASE_PATH + "/api/as-api";

export const COLOUR_SCHEME_STORAGE_KEY = LOCAL_STORAGE_PREFIX + "-colorScheme";
export const PROJECT_LOCAL_STORAGE_KEY = LOCAL_STORAGE_PREFIX + "-current-project";
export const UNIT_LOCAL_STORAGE_KEY = LOCAL_STORAGE_PREFIX + "-current-unit";
export const ORG_LOCAL_STORAGE_KEY = LOCAL_STORAGE_PREFIX + "-current-org";
export const PROJECT_FILE_LOCAL_STORAGE_KEY = LOCAL_STORAGE_PREFIX + "-selected-files";
export const EVENT_DEBUG_MODE_STORAGE_KEY = LOCAL_STORAGE_PREFIX + "-event-debug-mode";
