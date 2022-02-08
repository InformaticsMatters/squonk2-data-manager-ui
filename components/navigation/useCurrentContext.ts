import { useOrganisationUnit } from '../../context/organisationUnitContext';
import { useCurrentProject } from '../../hooks/projectHooks';

export const useCurrentContext = () => {
  const { organisationUnit } = useOrganisationUnit();
  const currentProject = useCurrentProject();

  if (organisationUnit) {
    const { organisation, unit } = organisationUnit;
    let context = organisation;

    if (unit) {
      context += `:${unit}`;

      if (currentProject) {
        context += `:${currentProject.name}`;
      }
    }

    return context;
  }

  return null;
};
