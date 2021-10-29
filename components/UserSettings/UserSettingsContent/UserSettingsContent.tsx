import { Container } from '@material-ui/core';

import { ProjectStatsSection } from './ProjectStatsSection';
import { UserSettingsSection } from './UserSettingsSection';

export const UserSettingsContent = () => {
  return (
    <Container maxWidth="md">
      <UserSettingsSection />
      <ProjectStatsSection />
    </Container>
  );
};
