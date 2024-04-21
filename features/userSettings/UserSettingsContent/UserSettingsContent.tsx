import { useEffect, useState } from "react";

import { useGetOrganisationUnits } from "@squonk/account-server-client/unit";
import { useGetProjects } from "@squonk/data-manager-client/project";

import {
  Box,
  Button,
  Container,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

import { CenterLoader } from "../../../components/CenterLoader";
import { PageSection } from "../../../components/PageSection";
import { PermissionLevelSelect } from "../../../components/PermissionLevelSelect";
import { isAPermissionLevel, type PermissionLevel } from "../../../components/userContext/filter";
import {
  projectPayload,
  useCurrentProject,
  useCurrentProjectId,
} from "../../../hooks/projectHooks";
import { getUserFilter } from "../../../hooks/useGetVisibleUnits";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../state/organisationSelection";
import { useSelectedUnit } from "../../../state/unitSelection";
import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../../../utils/next/localStorage";
import { ProjectStatsSection } from "../../ProjectStats";
import { UserBootstrapper } from "../../UserBootstrapper";
import { ContextSection } from "./ContextSection";

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const { setCurrentProjectId } = useCurrentProjectId();
  const [unit, setUnit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const router = useRouter();

  const { user, isLoading } = useKeycloakUser();

  const project = useCurrentProject();

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("editor");
  const { data: projects } = useGetProjects(undefined, {
    query: { select: (data) => data.projects },
  });
  const { data: units } = useGetOrganisationUnits(organisation?.id ?? "", {
    query: { select: (data) => data.units },
  });

  // the user could land on a project via a URL parameter. If we don't sync this state, the selected
  // project could be filtered out if the current user is not an administrator or editor
  const fallBackToNone =
    project !== null &&
    !!user.username &&
    project.administrators.includes(user.username) &&
    !project.editors.includes(user.username);

  const fallBackToEditor =
    project !== null &&
    !!user.username &&
    project.administrators.includes(user.username) &&
    project.editors.includes(user.username);

  useEffect(() => {
    if (fallBackToNone) {
      setPermissionLevel("none");
    }
    if (fallBackToEditor) {
      setPermissionLevel("editor");
    }
  }, [fallBackToNone, fallBackToEditor, setPermissionLevel]);

  if (isLoading || !user.username) {
    return <CenterLoader />;
  }

  return (
    <Container maxWidth="xl">
      <UserBootstrapper />

      <PageSection level={2} title="Organisation and Unit">
        <Box alignItems="baseline" display="flex" gap={1} marginBottom={1}>
          <Typography>
            Filter for user <em>{user.username}</em> where role is
          </Typography>
          <PermissionLevelSelect
            value={permissionLevel}
            onChange={(event) => {
              const level = event.target.value;
              if (isAPermissionLevel(level)) {
                // always update the permission level state
                setPermissionLevel(level);

                // then we need to check if the change to the filter means the currently selected
                // unit is no longer selectable. If so we just reset the user's unit selection.
                const unitFilter = getUserFilter(level, user.username, projects);
                const foundUnit = units?.filter(unitFilter).find((u) => u.id === unit?.id);

                if (!foundUnit) {
                  setUnit(undefined);
                }
              }
            }}
          />
        </Box>

        <ContextSection userFilter={[permissionLevel, user.username]} />
      </PageSection>

      <PageSection level={2} title="Project Stats">
        <ProjectStatsSection userFilter={[permissionLevel, user.username]} />
        <Typography sx={{ mt: 1 }} textAlign="right">
          Missing usage in the above tables indicates you are missing access to product stats
          belonging to another user.
        </Typography>
        <Tooltip title="Deselect project">
          <Button
            onClick={() => {
              setCurrentProjectId();
              setUnit(undefined);
              writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, projectPayload(undefined));
            }}
          >
            Clear
          </Button>
        </Tooltip>
        {router.pathname !== "/products" && (
          <ListItemButton onClick={() => void router.push({ pathname: "/products" })}>
            <ListItemText primary="Products" secondary="View all project and dataset products" />
          </ListItemButton>
        )}
      </PageSection>
    </Container>
  );
};
