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
import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { ProjectStatsSection } from "../../ProjectStats";
import { ContextSection } from "./ContextSection";
import { UserSettingsSection } from "./UserSettingsSection";

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const { setCurrentProjectId } = useCurrentProjectId();
  const router = useRouter();

  return (
    <Container maxWidth="lg">
      <PageSection level={2} title="User Settings">
        <UserSettingsSection />
      </PageSection>

      <PageSection level={2} title="Organisation and Unit">
        <Typography gutterBottom variant="body2">
          Filter the projects you are able to see by the organisation and unit a projects belongs
          to.
        </Typography>
        <ContextSection />
      </PageSection>

      <PageSection level={2} title="Project Stats">
        <ProjectStatsSection />
        <Tooltip title="Deselect project">
          <Button onClick={() => setCurrentProjectId()}>Clear</Button>
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
