import { Container } from '@material-ui/core';

import { PageSection } from '../../PageSection';
import { ProjectStatsSection } from './ProjectStatsSection';
import { UserSettingsSection } from './UserSettingsSection';

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  return (
    <Container maxWidth="md">
      <PageSection level={3} title="User Settings">
        <UserSettingsSection />
      </PageSection>

      <PageSection level={3} title="Project Stats">
        <ProjectStatsSection />
      </PageSection>
    </Container>
  );
};
