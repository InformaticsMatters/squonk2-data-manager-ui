import { Container } from '@material-ui/core';

import { ProjectStatsSection } from './ProjectStatsSection';
import { UserSettingsSection } from './UserSettingsSection';

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  return (
    <Container maxWidth="md">
      <UserSettingsSection />
      <ProjectStatsSection />
    </Container>
  );
};
