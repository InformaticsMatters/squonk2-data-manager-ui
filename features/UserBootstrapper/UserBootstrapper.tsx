import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { BootstrapAlert } from "./BootstrapAlert";

/**
 * If user is authorized it displays the BoostrappingAlert component.
 */
export const UserBootstrapper = () => {
  const isDMAuthorized = useDMAuthorizationStatus();

  const { projectId } = useCurrentProjectId();

  if (!isDMAuthorized || projectId) {
    return null;
  }

  return <BootstrapAlert />;
};
