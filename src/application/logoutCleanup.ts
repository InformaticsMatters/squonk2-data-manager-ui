import { forgetRememberedBillingUnit } from "../datasets/uploadBilling";
import { RECENT_PROJECTS_STORAGE_KEY } from "../projects/recentProjects";
import { clearLegacyScopeStorage } from "./applicationIdentity";

/**
 * Everything a logout removes from the browser's own storage.
 *
 * Logging out ends the session these were remembered for, so each one goes: the legacy project and
 * file scope, the recent-project history, and the billing unit of the last successful upload.
 * Preferences that belong to the browser rather than to the account — consent, debug mode — are
 * left alone, which is why the keys are named here rather than the store being emptied.
 */
export const clearAccountScopedStorageOnLogout = (storage: Pick<Storage, "removeItem">) => {
  clearLegacyScopeStorage(storage);
  storage.removeItem(RECENT_PROJECTS_STORAGE_KEY);
  forgetRememberedBillingUnit(storage);
};
