import type { FC, ReactNode } from "react";
import { useMemo } from "react";

import { PageSectionContext } from "./PageSectionContext";
import type { PageSectionContextType } from "./types";

export interface PageSectionProviderProps extends PageSectionContextType {
  children: ReactNode;
}

/**
 * A context provider for `PageSectionContext` context.
 */
export const PageSectionProvider: FC<PageSectionProviderProps> = ({ children, level }) => {
  const contextValue = useMemo<PageSectionContextType>(() => {
    return { level };
  }, [level]);

  return <PageSectionContext.Provider value={contextValue}>{children}</PageSectionContext.Provider>;
};
