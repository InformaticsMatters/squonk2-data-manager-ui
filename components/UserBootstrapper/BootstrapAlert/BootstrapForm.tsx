import { useCreateDefaultUnit } from '@squonk/account-server-client/unit';

import type { OrgAndUnitIdTuple } from '../../CreateProjectForm';
import { CreateProjectForm } from '../../CreateProjectForm';

/**
 * Form for creating a default unit with a project.
 */
export const BootstrapForm = () => {
  const { mutateAsync: createUnit } = useCreateDefaultUnit();

  return (
    <CreateProjectForm
      orgAndUnit={async () => {
        const { id: unitId, organisation_id } = await createUnit();
        return [organisation_id, unitId] as OrgAndUnitIdTuple;
      }}
    />
  );
};
