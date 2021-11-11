import type { FC } from 'react';
import { useMemo } from 'react';

import { PageSectionContext } from './PageSectionContext';
import type { PageSectionContextType } from './types';

/**
 * A context provider for `PageSectionContext` context.
 */
export const PageSectionProvider: FC<PageSectionContextType> = ({ children, level }) => {
  const contextValue = useMemo<PageSectionContextType>(() => {
    return { level };
  }, [level]);

  return <PageSectionContext.Provider value={contextValue}>{children}</PageSectionContext.Provider>;
};
