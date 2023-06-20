import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  FormControlLabel,
  ListItemButton,
  ListItemText,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

import { PageSection } from "../../../components/PageSection";
import {
  projectPayload,
  useCurrentProject,
  useCurrentProjectId,
} from "../../../hooks/projectHooks";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../../../utils/next/localStorage";
import { ProjectStatsSection } from "../../ProjectStats";
import { UserBootstrapper } from "../../UserBootstrapper";
import { ContextSection } from "./ContextSection";

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const { setCurrentProjectId } = useCurrentProjectId();
  const router = useRouter();

  const { user } = useKeycloakUser();

  const [userIsOwnerOnly, setUserIsOwnerOnly] = useState(true);
  const project = useCurrentProject();
  const owner = project?.owner;

  // the user could land on a project via a URL parameter. If we don't sync this state, the selected
  // project could be filtered out if the current user is not the owner.
  // E.g. a user's friend send one of the friend's projects to check out, the current user is not
  // the owner of this project so it wouldn't appear in the table.
  useEffect(() => {
    if (!!owner && owner !== user.username) {
      setUserIsOwnerOnly(false);
    }
  }, [owner, user.username]);

  return (
    <Container maxWidth="lg">
      <UserBootstrapper />

      <PageSection level={2} title="Organisation and Unit">
        <Typography variant="body2">
          Filter the projects you are able to see by the organisation and unit
        </Typography>

        <Box marginBottom={1}>
          <FormControlLabel
            control={
              <Switch
                checked={userIsOwnerOnly}
                inputProps={{ "aria-label": "user-is-owner-toggle" }}
                onChange={(event) => setUserIsOwnerOnly(event.target.checked)}
              />
            }
            label="Only I am the owner"
            labelPlacement="start"
          />
        </Box>

        <ContextSection userFilter={userIsOwnerOnly ? user.username : undefined} />
      </PageSection>

      <PageSection level={2} title="Project Stats">
        <ProjectStatsSection userFilter={userIsOwnerOnly ? user.username : undefined} />
        <Typography sx={{ mt: 1 }} textAlign="right">
          Missing info in the above tables indicates you are missing access to product stats
          belonging to another user.
        </Typography>
        <Tooltip title="Deselect project">
          <Button
            onClick={() => {
              setCurrentProjectId();
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
