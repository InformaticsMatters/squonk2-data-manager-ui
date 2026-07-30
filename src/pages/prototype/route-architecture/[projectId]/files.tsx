import { useRouter } from "next/router";

import { SharedScopePage } from "../../../../prototypes/routeArchitecture/sharedScope/page";
import { VerticalHooksPage } from "../../../../prototypes/routeArchitecture/verticalHooks/page";
import { VerticalProviderPage } from "../../../../prototypes/routeArchitecture/verticalProvider/page";

const RouteArchitecturePrototype = () => {
  const router = useRouter();
  if (!router.isReady || typeof router.query.projectId !== "string") {
    return null;
  }

  switch (router.query.variant) {
    case "B":
      return <VerticalHooksPage projectId={router.query.projectId} />;
    case "C":
      return <SharedScopePage projectId={router.query.projectId} />;
    default:
      return <VerticalProviderPage projectId={router.query.projectId} />;
  }
};

export default RouteArchitecturePrototype;
