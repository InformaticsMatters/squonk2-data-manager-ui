import { useEffect } from "react";

import { useRouter } from "next/router";

import { PROJECT_LOCAL_STORAGE_KEY } from "../constants";
import { getFromLocalStorage } from "../utils/localStorage";
import type { ProjectLocalStoragePayload } from "./projectHooks";

const PATHS_FOR_UPDATE = ["/datasets", "/project", "/executions", "/results"];

export const useBindProjectFromLSToQParams = () => {
  const router = useRouter();

  const { isReady, pathname, query, push } = router;

  const shouldNavigate = PATHS_FOR_UPDATE.map((s) => pathname.startsWith(s)).some((b) => b);

  useEffect(() => {
    const { projectId } = getFromLocalStorage<
      ProjectLocalStoragePayload | Record<string, undefined>
    >(PROJECT_LOCAL_STORAGE_KEY, {});

    if (isReady && shouldNavigate && projectId) {
      push({ pathname, query: { project: projectId, ...query } }, undefined, {
        shallow: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
