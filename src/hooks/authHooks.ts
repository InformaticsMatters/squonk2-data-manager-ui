import { clearLegacyScopeStorage } from "../application/applicationIdentity";
import { forgetRememberedBillingUnit } from "../datasets/uploadBilling";
import { RECENT_PROJECTS_STORAGE_KEY } from "../projects/recentProjects";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { useSelectedUnit } from "../state/unitSelection";

export const useCleanUpOnLogout = () => {
  const [, setUnit] = useSelectedUnit();
  const [, setOrganisation] = useSelectedOrganisation();

  return () => {
    clearLegacyScopeStorage(localStorage);
    localStorage.removeItem(RECENT_PROJECTS_STORAGE_KEY);
    forgetRememberedBillingUnit(localStorage);
    setUnit(undefined);
    setOrganisation(undefined);
  };
};
