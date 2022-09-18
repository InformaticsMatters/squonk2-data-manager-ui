import { useCreateDefaultUnit } from "@squonk/account-server-client/unit";

import { CreateProjectForm } from "../../../components/projects/CreateProjectForm";

/**
 * Form for creating a default unit with a project.
 */
export const BootstrapForm = () => {
  const { mutateAsync: createUnit } = useCreateDefaultUnit();
  return (
    <CreateProjectForm
      unitId={async () => {
        const { id: unitId } = await createUnit();
        return unitId;
      }}
    />
  );
};
