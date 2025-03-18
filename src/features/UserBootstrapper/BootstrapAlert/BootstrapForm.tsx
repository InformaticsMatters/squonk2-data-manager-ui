import { useCreateDefaultUnit } from "@squonk/account-server-client/unit";

import { CreateProjectForm } from "../../../components/projects/CreateProject/CreateProjectForm";
import { useSelectedOrganisation } from "../../../state/organisationSelection";
import { getBillingDay } from "../../../utils/app/products";

/**
 * Form for creating a default unit with a project.
 */
export const BootstrapForm = () => {
  const [organisation] = useSelectedOrganisation();
  const { mutateAsync: createUnit } = useCreateDefaultUnit();

  if (!organisation) {
    return null;
  }

  // The personal unit will be created with the default privacy of the default organisation
  return (
    <CreateProjectForm
      defaultPrivacy={organisation.default_product_privacy}
      unitId={async () => {
        const { id: unitId } = await createUnit({ data: { billing_day: getBillingDay() } });
        return unitId;
      }}
    />
  );
};
