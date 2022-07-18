import { Button, Container, Tooltip } from "@mui/material";

import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { useSelectedUnit } from "../../../state/unitSelection";
import { PageSection } from "../../PageSection";
import { ContextSection } from "./ContextSection";
import { ProjectStatsSection } from "./ProjectStatsSection";
import { UserSettingsSection } from "./UserSettingsSection";

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const [unit] = useSelectedUnit();

  const { setCurrentProjectId } = useCurrentProjectId();

  return (
    <Container maxWidth="lg">
      <PageSection level={2} title="User Settings">
        <UserSettingsSection />
      </PageSection>

      <PageSection level={2} title="Context">
        <ContextSection />
      </PageSection>

      {unit && (
        <PageSection level={2} title="Project Stats">
          <ProjectStatsSection />
          <Tooltip title="Deselect project">
            <Button onClick={() => setCurrentProjectId()}>Clear</Button>
          </Tooltip>
        </PageSection>
      )}
    </Container>
  );
};
