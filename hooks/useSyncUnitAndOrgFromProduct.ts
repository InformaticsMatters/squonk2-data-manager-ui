import { useEffect } from "react";

import type { OrganisationDetail } from "@squonk/account-server-client";
import { OrganisationDetailDefaultProductPrivacy } from "@squonk/account-server-client";
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
    // ensure the partial org is all there before "asserting" that it's an OrganisationDetail type
    // TODO convert this check to use a zod schema
    if (
      typeof defaultOrg?.id === "string" &&
      defaultOrg.caller_is_member !== undefined &&
      typeof defaultOrg.created === "string" &&
      typeof defaultOrg.name === "string" &&
      defaultOrg.private !== undefined
    ) {
      const defaultOrgCopy = {
        ...defaultOrg,
        default_product_privacy: OrganisationDetailDefaultProductPrivacy.DEFAULT_PUBLIC,
      } as OrganisationDetail;

      setOrganisation(defaultOrgCopy);
    }
  }, [defaultOrg, setOrganisation]);

  // Used in case a user directly navigates to a project's URL
  useEffect(() => {
    if (currentProject && product) {
      setUnit(product.unit);
      setOrganisation(product.organisation); // override the default org
    }
  }, [currentProject, product, setUnit, setOrganisation, defaultOrg]);
};
