import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Alert } from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";

import { CenterLoader } from "../components/CenterLoader";
import { type FamilyPagePolicy, type FamilyRoute, resolveFamilyRoute } from "./familyRoute";

type FamilyRouteContextValue =
  | { localNotFound: false; policy: FamilyPagePolicy; route: FamilyRoute }
  | { localNotFound: true; policy: FamilyPagePolicy; route: null };

const FamilyRouteContext = createContext<FamilyRouteContextValue | null>(null);

export const useFamilyRoute = (): FamilyRouteContextValue => {
  const route = useContext(FamilyRouteContext);
  if (!route) {
    throw new Error("Family route is unavailable");
  }
  return route;
};

export const FamilyRouteBoundary = ({
  children,
  policy,
}: {
  children: ReactNode;
  policy: FamilyPagePolicy;
}) => {
  const router = useRouter();
  const decision = useMemo(
    () => resolveFamilyRoute(policy, router.asPath, router.isReady),
    [policy, router.asPath, router.isReady],
  );
  const routeContext = useMemo<FamilyRouteContextValue | null>(() => {
    if (decision.kind === "ready") {
      return { localNotFound: false, policy, route: decision.route };
    }
    if (decision.kind === "local-not-found") {
      return { localNotFound: true, policy, route: null };
    }
    return null;
  }, [decision, policy]);
  const canonicalHref = decision.kind === "replace" ? decision.canonicalHref : null;
  const replacingHref = useRef<string | null>(null);
  const [failedHref, setFailedHref] = useState<string | null>(null);
  // The family contract includes canonical routes before their Pages Router entries are introduced.
  const replace = router.replace as unknown as (href: string) => Promise<boolean>;

  useEffect(() => {
    if (!canonicalHref) {
      replacingHref.current = null;
      return;
    }
    if (replacingHref.current === canonicalHref) {
      return;
    }
    replacingHref.current = canonicalHref;
    const markFailed = () => {
      if (replacingHref.current === canonicalHref) {
        replacingHref.current = null;
        setFailedHref(canonicalHref);
      }
    };
    void replace(canonicalHref).then((replaced) => {
      if (!replaced) {
        markFailed();
      }
    }, markFailed);
  }, [canonicalHref, replace]);

  if (decision.kind === "not-found") {
    return <NextError statusCode={404} />;
  }
  if (canonicalHref && failedHref === canonicalHref) {
    return <Alert severity="error">Unable to canonicalise this route. Reload to retry.</Alert>;
  }
  if (!routeContext) {
    return <CenterLoader />;
  }

  return <FamilyRouteContext value={routeContext}>{children}</FamilyRouteContext>;
};
