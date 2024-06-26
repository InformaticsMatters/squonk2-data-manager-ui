import { type ReactElement } from "react";

import { useSyncProject } from "../../hooks/useSyncProject";
import { useSyncUnitAndOrgFromProduct } from "../../hooks/useSyncUnitAndOrgFromProduct";

export interface TopLevelHooksProps {
  children: ReactElement;
}

/**
 * "No-op" component that only calls hooks that require providers higher up in the tree
 */
export const TopLevelHooks = ({ children }: TopLevelHooksProps) => {
  // Depends on react-query and Jotai (implicit) providers existing
  useSyncProject();
  useSyncUnitAndOrgFromProduct();

  return children;
};
