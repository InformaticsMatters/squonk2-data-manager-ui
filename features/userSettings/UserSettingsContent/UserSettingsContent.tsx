import {
  Button,
  Container,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

import { PageSection } from "../../../components/PageSection";
import { projectPayload, useCurrentProjectId } from "../../../hooks/projectHooks";
import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../../../utils/next/localStorage";
import { ProjectStatsSection } from "../../ProjectStats";
import { ContextSection } from "./ContextSection";

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const { setCurrentProjectId } = useCurrentProjectId();
  const router = useRouter();

  return (
    <Container maxWidth="lg">
      <PageSection level={2} title="Organisation and Unit">
        <Typography gutterBottom variant="body2">
          Filter the projects you are able to see by the organisation and unit a projects belongs
          to.
        </Typography>
        <ContextSection />
      </PageSection>

      <PageSection level={2} title="Project Stats">
        <ProjectStatsSection />
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
          <ListItemButton
            onClick={() => {
              router.push({ pathname: "/products" });
            }}
          >
            <ListItemText primary="Products" secondary="View all project and dataset products" />
          </ListItemButton>
        )}
      </PageSection>
    </Container>
  );
};
