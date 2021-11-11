import { createContext } from 'react';

import type { PageSectionContextType } from './types';

/**
 * A context which passes a derived level to child `PageSection` components.
 */
export const PageSectionContext = createContext<PageSectionContextType>({});
