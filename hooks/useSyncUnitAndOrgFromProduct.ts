import { useEffect } from "react";

import { useGetDefaultOrganisation } from "@squonk/account-server-client/organisation";
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

  const { data: defaultOrg } = useGetDefaultOrganisation();

  const [, setUnit] = useSelectedUnit();
  const [, setOrganisation] = useSelectedOrganisation();

  // First set the default org as the current org on first load
  useEffect(() => {
    setOrganisation(defaultOrg);
  }, [defaultOrg, setOrganisation]);

  // Used in case a user directly navigates to a project's URL
  useEffect(() => {
    if (currentProject && product) {
      setUnit(product.unit);
      setOrganisation(product.organisation); // override the default org
    }
  }, [currentProject, product, setUnit, setOrganisation, defaultOrg]);
};
