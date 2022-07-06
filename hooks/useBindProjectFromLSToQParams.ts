import { useEffect } from "react";

import { useRouter } from "next/router";

import { PROJECT_LOCAL_STORAGE_KEY } from "../constants";
import { getFromLocalStorage } from "../utils/localStorage";
import type { ProjectLocalStoragePayload } from "./projectHooks";

export const useBindProjectFromLSToQParams = () => {
  const router = useRouter();

  useEffect(
    () => {
      const { projectId } = getFromLocalStorage<
        ProjectLocalStoragePayload | Record<string, undefined>
      >(PROJECT_LOCAL_STORAGE_KEY, {});

      if (router.isReady && projectId) {
        router.push({ pathname: router.pathname, query: { project: projectId, ...router.query } });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query.project],
  );
};
