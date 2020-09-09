import { useContext } from 'react';

import { CurrentProjectContext } from '../context/currentProject';

/**
 * Get the currently selected project from the CurrentProject context
 */
export const useCurrentProject = () => useContext(CurrentProjectContext);
