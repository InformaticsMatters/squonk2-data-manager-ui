import { type Dispatch, type SetStateAction } from "react";

import { Breadcrumbs, Link, Typography } from "@mui/material";

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
    {["root", ...breadcrumbs].map((path, pathIndex) =>
      pathIndex < breadcrumbs.length ? (
        <Link
          color="inherit"
          component="button"
          // eslint-disable-next-line react/no-array-index-key
          key={`${pathIndex}-${path}`}
          variant="body1"
          onClick={() => setBreadcrumbs(breadcrumbs.slice(0, pathIndex))}
        >
          {path}
        </Link>
      ) : (
        // eslint-disable-next-line react/no-array-index-key
        <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
      ),
    )}
  </Breadcrumbs>
);
