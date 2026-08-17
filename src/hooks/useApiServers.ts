import { useEffect, useState } from "react";

import { type ApiServers, apiServersSnapshot, loadApiServers } from "../application/apiServers";

/**
 * This deployment's API addresses, or undefined until they arrive.
 *
 * The API clients read them through their own request gate in `_app`; this is for the components
 * that address a service directly, and hands back the snapshot when a previous caller has already
 * loaded them.
 */
export const useApiServers = (): ApiServers | undefined => {
  const [servers, setServers] = useState(apiServersSnapshot);

  useEffect(() => {
    if (servers) {
      return;
    }
    let isCurrent = true;
    void loadApiServers().then((next) => {
      if (isCurrent) {
        setServers(next);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [servers]);

  return servers;
};
