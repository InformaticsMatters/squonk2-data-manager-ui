import { useGetDefaultOrganisation } from "@squonk/account-server-client/organisation";

import { Box } from "@mui/material";

import { CenterLoader } from "../../components/CenterLoader";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { BootstrapAlert } from "./BootstrapAlert";

/**
 * If user is authorized it displays the BoostrappingAlert component.
 */
export const UserBootstrapper = () => {
  const isDMAuthorized = useDMAuthorizationStatus();

  const { projectId } = useCurrentProjectId();

  const { data, isLoading } = useGetDefaultOrganisation({ query: { enabled: !!isDMAuthorized } });

  const defaultOrganisation = data; // {};

  if (!isDMAuthorized || projectId) {
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ height: 92.5 + 2 * 16 }}>
        <CenterLoader />
      </Box>
    );
  }

  if (defaultOrganisation?.id === undefined) {
    return null;
  }

  return <BootstrapAlert />;
};
