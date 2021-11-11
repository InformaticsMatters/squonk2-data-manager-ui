import { useContext } from 'react';

import { PageSectionContext } from './PageSectionContext';

/**
 * A helper hook for `PageSectionContext`.
 */
export const usePageSectionContext = () => {
  return useContext(PageSectionContext);
};
