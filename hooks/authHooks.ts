import { useSelectedOrganisation } from "../state/organisationSelection";
import { useSelectedUnit } from "../state/unitSelection";

export const useCleanUpOnLogout = () => {
  const [, setUnit] = useSelectedUnit();
  const [, setOrganisation] = useSelectedOrganisation();

  return () => {
    localStorage.clear();
    setUnit(undefined);
    setOrganisation(undefined);
  };
};
