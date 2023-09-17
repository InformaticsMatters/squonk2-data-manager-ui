import { useEffect } from "react";

import { getProject } from "@squonk/data-manager-client/project";

import type { AxiosError } from "axios";
import compare from "just-compare";
import { useRouter } from "next/router";

import {
  getFromLocalStorage,
  PROJECT_LOCAL_STORAGE_KEY,
  writeToLocalStorage,
} from "../utils/next/localStorage";
import { projectPayload } from "./projectHooks";

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
export const useSyncProject = () => {
  const router = useRouter();

  const { isReady, pathname, query, replace } = router;
  const { project } = query;

  // Sync the project query parameter to local storage - one way
  useEffect(() => {
    if (typeof project === "string") {
      writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, projectPayload(project));
    }
  }, [project]);

  // Load the project from local storage only when one exists in local storage and one isn't
  // provided in the url
  useEffect(() => {
    const updateFromLocalStorage = async () => {
      const { projectId } = getFromLocalStorage(
        PROJECT_LOCAL_STORAGE_KEY,
        projectPayload(undefined),
      );

      if (projectId !== undefined && projectId !== "") {
        try {
          await getProject(projectId);
          if (isReady && !project) {
            const newQuery = { ...query, project: projectId };
            if (!compare(query, newQuery)) {
              const href = { query: newQuery, pathname };

              replace(href, undefined);
            }
          }
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.isAxiosError && axiosError.response?.status === 404) {
            // If the project doesn't exist, remove it from local storage
            writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, projectPayload(undefined));
            // And remove it from the url
            const newQuery = { ...query };
            delete newQuery["project"];
            const href = { query: newQuery, pathname };
            replace(href, undefined);
          }
        }
      }
    };
    updateFromLocalStorage();
  }, [isReady, pathname, project, query, replace]);
};
