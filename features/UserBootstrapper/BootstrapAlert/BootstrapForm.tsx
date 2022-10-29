import { useCreateDefaultUnit } from "@squonk/account-server-client/unit";

import { CreateProjectForm } from "../../../components/projects/CreateProjectForm";
import { getBillingDay } from "../../../utils/app/products";

/**
 * Form for creating a default unit with a project.
 */
export const BootstrapForm = () => {
  const { mutateAsync: createUnit } = useCreateDefaultUnit();
  return (
    <CreateProjectForm
      unitId={async () => {
        const { id: unitId } = await createUnit({
          data: { billing_day: getBillingDay() },
        });
        return unitId;
      }}
    />
  );
};
