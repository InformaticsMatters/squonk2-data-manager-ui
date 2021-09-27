import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { Breadcrumbs, Link, Typography } from '@material-ui/core';

export interface PathBreadcrumbs {
  /**
   * Array of directory names
   */
  breadcrumbs: string[];
  /**
   * Called when links are clicked
   */
  setBreadcrumbs: Dispatch<SetStateAction<string[]>>;
}

/**
 * MuiBreadcrumbs with click actions to navigate back up directories
 */
export const PathBreadcrumbs = ({ breadcrumbs, setBreadcrumbs }: PathBreadcrumbs) => (
  <Breadcrumbs>
    {['root', ...breadcrumbs].map((path, pathIndex) =>
      pathIndex < breadcrumbs.length ? (
        <Link
          color="inherit"
          component="button"
          key={`${pathIndex}-${path}`}
          variant="body1"
          onClick={() => setBreadcrumbs(breadcrumbs.slice(0, pathIndex))}
        >
          {path}
        </Link>
      ) : (
        <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
      ),
    )}
  </Breadcrumbs>
);
