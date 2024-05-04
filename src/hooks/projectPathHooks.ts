import { useMemo } from "react";

import { useRouter } from "next/router";

/**
 * @returns The selected projectId from the project key of the query parameters
 */
export const useProjectBreadcrumbs = () => {
  const router = useRouter();

  const path = router.query.path;

  // Need to memoize this so the project-table doesn't cause a render loop
  const breadcrumbs = useMemo(() => (path === undefined ? [] : [path].flat()), [path]);

  return breadcrumbs;
};
