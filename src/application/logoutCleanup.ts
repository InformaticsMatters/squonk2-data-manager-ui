import { forgetRememberedBillingUnit } from "../datasets/uploadBilling";
import { PROJECT_CREATION_RECOVERY_KEY } from "../projects/projectCreation";
import { PROJECT_DELETION_RECOVERY_KEY } from "../projects/projectDeletion";
import { RECENT_PROJECTS_STORAGE_KEY } from "../projects/recentProjects";
import {
  APPLICATION_ORGANISATION_STORAGE_KEY,
  clearLegacyScopeStorage,
} from "./applicationIdentity";

/**
 * Everything a logout removes from the browser's own storage.
 *
 * Logging out ends the session these were remembered for, so each one goes: the organisation this
 * account was working as, the legacy project and file scope, the recent-project history, the
 * billing unit of the last successful upload, and the records of a project creation or deletion
 * this account left in flight. Preferences that belong to the browser rather than to the account —
 * consent, debug mode, colour scheme — are left alone, which is why the keys are named here rather
 * than the store being emptied.
 *
 * It removes keys and touches no in-memory state. Clearing the organisation a mounted project
 * boundary is displaying would make that boundary adopt the project's organisation again, and
 * record the project as recent again, in the moment between the logout and the navigation that
 * ends the document. Taking the keys and leaving the page to be replaced cannot lose that race.
 */
export const clearAccountScopedStorageOnLogout = (
  // Named rather than positional: the two stores are structurally identical, so a positional pair
  // could be swapped without the compiler noticing, and each key would then survive the logout.
  { local, session }: { local: Pick<Storage, "removeItem">; session: Pick<Storage, "removeItem"> },
) => {
  clearLegacyScopeStorage(local);
  local.removeItem(APPLICATION_ORGANISATION_STORAGE_KEY);
  local.removeItem(RECENT_PROJECTS_STORAGE_KEY);
  local.removeItem(PROJECT_DELETION_RECOVERY_KEY);
  forgetRememberedBillingUnit(local);
  session.removeItem(PROJECT_CREATION_RECOVERY_KEY);
};
