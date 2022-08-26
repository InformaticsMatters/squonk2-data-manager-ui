import { Button, Container, Tooltip, Typography } from "@mui/material";

import { PageSection } from "../../../components/PageSection";
import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { ContextSection } from "./ContextSection";
import { ProjectStatsSection } from "./ProjectStatsSection";
import { UserSettingsSection } from "./UserSettingsSection";

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const { setCurrentProjectId } = useCurrentProjectId();

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
      </PageSection>
    </Container>
  );
};
