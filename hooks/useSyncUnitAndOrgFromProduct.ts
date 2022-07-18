import { useEffect } from "react";

import { useGetProduct } from "@squonk/account-server-client/product";

import { useSelectedOrganisation } from "../state/organisationSelection";
import { useSelectedUnit } from "../state/unitSelection";
import { useCurrentProject } from "./projectHooks";

export const useSyncUnitAndOrgFromProduct = () => {
  const currentProject = useCurrentProject();
  const { data } = useGetProduct(currentProject?.product_id ?? "", {
    query: { enabled: !!currentProject?.product_id },
  });
  const product = data?.product;

  const [, setUnit] = useSelectedUnit();
  const [, setOrganisation] = useSelectedOrganisation();

  useEffect(() => {
    // Used in case a user directly navigates to a project's URL
    if (currentProject && product) {
      setUnit(product.unit);
      setOrganisation(product.organisation);
    }
  }, [currentProject, product, setUnit, setOrganisation]);
};
