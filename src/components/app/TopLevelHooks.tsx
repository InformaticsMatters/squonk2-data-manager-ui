import { type ReactElement, useEffect, useState } from "react";

import { useSetupApiClients } from "../../hooks/useSetupApiClients";
import { useSyncProject } from "../../hooks/useSyncProject";
import { useSyncUnitAndOrgFromProduct } from "../../hooks/useSyncUnitAndOrgFromProduct";

export interface TopLevelHooksProps {
  children: ReactElement;
}

/**
 * "No-op" component that only calls hooks that require providers higher up in the tree
 */
const ClientTopLevelHooks = () => {
  useSyncProject();
  useSyncUnitAndOrgFromProduct();
  useSetupApiClients();

  return null;
};

export const TopLevelHooks = ({ children }: TopLevelHooksProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  return (
    <>
      {!!isClient && <ClientTopLevelHooks />}
      {children}
    </>
  );
};
