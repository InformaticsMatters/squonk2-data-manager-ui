import { useEffect } from "react";

import compare from "just-compare";
import { useRouter } from "next/router";

import { PROJECT_LOCAL_STORAGE_KEY } from "../constants/localStorageKeys";
import { getFromLocalStorage } from "../utils/next/localStorage";
import type { ProjectLocalStoragePayload } from "./projectHooks";

/**
 * Hook to synchronise the project local storage to query params.
 * E.g. if the user visits example-ui.com/data-manager-ui/sub/path, the url will be *replaced* with
 * example-ui.com/data-manager-ui/sub/path?project=project-blah-blah-blah-blah using the project ID
 * loaded from local storage.
 *
 * @private
 * It could be better to use a local storage event listener here but I find those unreliable
 * If the project was stored server-side this could be done in a middleware but alas.
 */
export const useBindProjectFromLSToQParams = () => {
  const router = useRouter();

  const { isReady, pathname, query, replace } = router;

  useEffect(() => {
    const { projectId } = getFromLocalStorage<
      ProjectLocalStoragePayload | Record<string, undefined>
    >(PROJECT_LOCAL_STORAGE_KEY, {});

    if (isReady && projectId) {
      const newQuery = { ...query, project: projectId };
      if (!compare(query, newQuery)) {
        replace({ pathname, query: newQuery }, undefined, {
          shallow: true,
        });
      }
    }
  }, [isReady, pathname, replace, query]);
};
