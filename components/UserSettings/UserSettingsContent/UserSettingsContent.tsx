import { Container } from '@material-ui/core';

import { useOrganisationUnit } from '../../../context/organisationUnitContext';
import { PageSection } from '../../PageSection';
import { ContextSection } from './ContextSection';
import { ProjectStatsSection } from './ProjectStatsSection';
import { UserSettingsSection } from './UserSettingsSection';

/**
 * Container component which displays various sections for User Settings.
 */
export const UserSettingsContent = () => {
  const {
    organisationUnit: { unit },
  } = useOrganisationUnit();

  return (
    <Container maxWidth="md">
      <PageSection level={2} title="User Settings">
        <UserSettingsSection />
      </PageSection>

      <PageSection level={2} title="Context">
        <ContextSection />
      </PageSection>

      {unit && (
        <PageSection level={2} title="Project Stats">
          <ProjectStatsSection />
        </PageSection>
      )}
    </Container>
  );
};
