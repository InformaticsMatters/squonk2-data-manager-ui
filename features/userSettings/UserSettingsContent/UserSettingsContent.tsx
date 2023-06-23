import type { ChangeEventHandler } from "react";
import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

import { CenterLoader } from "../../../components/CenterLoader";
import { PageSection } from "../../../components/PageSection";
import type { PermissionLevel } from "../../../components/userContext/filter";
import { isAPermissionLevel, PERMISSION_LEVELS } from "../../../components/userContext/filter";
import {
  projectPayload,
  useCurrentProject,
  useCurrentProjectId,
} from "../../../hooks/projectHooks";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { useSelectedUnit } from "../../../state/unitSelection";
import { capitalise } from "../../../utils/app/language";
import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../../../utils/next/localStorage";
import { ProjectStatsSection } from "../../ProjectStats";
import { UserBootstrapper } from "../../UserBootstrapper";
import { ContextSection } from "./ContextSection";

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const { setCurrentProjectId } = useCurrentProjectId();
  const [, setUnit] = useSelectedUnit();
  const router = useRouter();

  const { user, isLoading } = useKeycloakUser();

  const project = useCurrentProject();

  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("owner");
  console.log(permissionLevel);

  // the user could land on a project via a URL parameter. If we don't sync this state, the selected
  // project could be filtered out if the current user is not the owner or editor
  const fallBackToNone =
    project !== null &&
    !!user.username &&
    project.owner !== user.username &&
    !project.editors.includes(user.username);
  const fallBackToEditor =
    project !== null &&
    !!user.username &&
    project.owner !== user.username &&
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
    <Container maxWidth="lg">
      <UserBootstrapper />

      <PageSection level={2} title="Organisation and Unit">
        <Typography gutterBottom variant="body2">
          Filter the projects you are able to see by the organisation and unit
        </Typography>

        <Box alignItems="baseline" display="flex" gap={1} marginBottom={1}>
          <Typography>
            <em>{user.username}</em> is
          </Typography>
          <PermissionLevelSelect
            value={permissionLevel}
            onChange={(event) =>
              isAPermissionLevel(event.target.value) && setPermissionLevel(event.target.value)
            }
          />
        </Box>

        <ContextSection userFilter={[permissionLevel, user.username]} />
      </PageSection>

      <PageSection level={2} title="Project Stats">
        <ProjectStatsSection userFilter={[permissionLevel, user.username]} />
        <Typography sx={{ mt: 1 }} textAlign="right">
          Missing info in the above tables indicates you are missing access to product stats
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
          <ListItemButton onClick={() => router.push({ pathname: "/products" })}>
            <ListItemText primary="Products" secondary="View all project and dataset products" />
          </ListItemButton>
        )}
      </PageSection>
    </Container>
  );
};

export interface PermissionLevelSelectProps {
  value: PermissionLevel;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

const PermissionLevelSelect = ({ value, onChange }: PermissionLevelSelectProps) => {
  return (
    <TextField select label="Version" size="small" value={value} onChange={onChange}>
      {PERMISSION_LEVELS.map((level) => (
        <MenuItem key={level} value={level}>
          {capitalise(level === "none" ? "any" : level)}
        </MenuItem>
      ))}
    </TextField>
  );
};
