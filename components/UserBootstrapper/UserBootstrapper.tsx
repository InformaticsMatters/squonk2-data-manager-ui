import { useIsAuthorized } from "../../hooks/useIsAuthorized";
import { BootstrapAlert } from "./BootstrapAlert";

/**
 * If user is authorized it displays the BoostrappingAlert component.
 */
export const UserBootstrapper = () => {
  const isAuthorized = useIsAuthorized();

  if (!isAuthorized) {
    return null;
  }

  return <BootstrapAlert />;
};
