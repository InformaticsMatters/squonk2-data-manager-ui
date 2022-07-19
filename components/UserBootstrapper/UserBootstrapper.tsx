import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useIsAuthorized } from "../../hooks/useIsAuthorized";
import { BootstrapAlert } from "./BootstrapAlert";

/**
 * If user is authorized it displays the BoostrappingAlert component.
 */
export const UserBootstrapper = () => {
  const isAuthorized = useIsAuthorized();

  const { projectId } = useCurrentProjectId();

  if (!isAuthorized || projectId) {
    return null;
  }

  return <BootstrapAlert />;
};
