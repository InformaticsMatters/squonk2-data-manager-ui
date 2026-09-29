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
import { type RouteNotFoundParent } from "../routing/routeContract";
import {
  type FamilyPagePolicy,
  type FamilyRoute,
  type FamilyRouteDecision,
  resolveFamilyRoute,
} from "./familyRoute";
import { type PagePolicy } from "./pagePolicy";

export type FamilyRouteContextValue =
  | { localNotFound: false; parent?: undefined; policy: FamilyPagePolicy; route: FamilyRoute }
  /** The parent the unaddressable child named, so the section can keep rendering beneath it. */
  | { localNotFound: true; parent: RouteNotFoundParent; policy: FamilyPagePolicy; route: null };

/**
 * What the resolver publishes and the gate acts on.
 *
 * Resolution and gating are separated so the chrome, which is mounted above every failure state,
 * can read the route the URL names while the failure and pending states still render beneath the
 * chrome. Both read one value rather than deriving the decision twice, because deriving it twice
 * would give a canonicalising URL two components racing to replace it.
 */
type FamilyRouteResolution = {
  canonicalisationFailed: boolean;
  decision: FamilyRouteDecision;
  route: FamilyRouteContextValue | null;
};

const FamilyRouteResolutionContext = createContext<FamilyRouteResolution | null>(null);

export const useOptionalFamilyRoute = (): FamilyRouteContextValue | null =>
  useContext(FamilyRouteResolutionContext)?.route ?? null;

export const useFamilyRoute = (): FamilyRouteContextValue => {
  const route = useOptionalFamilyRoute();
  if (!route) {
    throw new Error("Family route is unavailable");
  }
  return route;
};

/**
 * Resolves the URL against the page's own family, above the chrome that reads the answer.
 *
 * It is universal rather than family-only, and unconditionally so: a public or application page
 * resolves to no family at all rather than to a different component. The chrome is mounted beneath
 * this element, so anything that changed the element type here — including returning children
 * directly for the policies with no family — would unmount and rebuild the chrome whenever a caller
 * crossed between policy branches, which is the whole of what this change exists to prevent.
 */
export const FamilyRouteResolver = ({
  children,
  policy,
}: {
  children: ReactNode;
  policy: PagePolicy;
}) => {
  const router = useRouter();
  const familyPolicy: FamilyPagePolicy | null =
    policy.kind === "application" || policy.kind === "public" ? null : policy;
  const decision = useMemo(
    () => (familyPolicy ? resolveFamilyRoute(familyPolicy, router.asPath, router.isReady) : null),
    [familyPolicy, router.asPath, router.isReady],
  );
  const route = useMemo<FamilyRouteContextValue | null>(() => {
    if (!familyPolicy || !decision) {
      return null;
    }
    if (decision.kind === "ready") {
      return { localNotFound: false, policy: familyPolicy, route: decision.route };
    }
    if (decision.kind === "local-not-found") {
      return { localNotFound: true, parent: decision.parent, policy: familyPolicy, route: null };
    }
    return null;
  }, [decision, familyPolicy]);
  const canonicalHref = decision?.kind === "replace" ? decision.canonicalHref : null;
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

  const resolution = useMemo<FamilyRouteResolution | null>(
    () =>
      decision && {
        canonicalisationFailed: canonicalHref !== null && failedHref === canonicalHref,
        decision,
        route,
      },
    [canonicalHref, decision, failedHref, route],
  );

  return <FamilyRouteResolutionContext value={resolution}>{children}</FamilyRouteResolutionContext>;
};

/**
 * Renders the resolved route's failure and pending states, beneath the chrome.
 *
 * A not-found or uncanonicalisable URL is stated inside the masthead, navigation and footer rather
 * than in place of them, so a caller who mistyped an address has somewhere to go from it.
 */
export const FamilyRouteGate = ({ children }: { children: ReactNode }) => {
  const resolution = useContext(FamilyRouteResolutionContext);
  if (!resolution) {
    throw new Error("Family route resolution is unavailable");
  }
  if (resolution.decision.kind === "not-found") {
    return <NextError statusCode={404} />;
  }
  if (resolution.canonicalisationFailed) {
    return <Alert severity="error">Unable to canonicalise this route. Reload to retry.</Alert>;
  }
  if (!resolution.route) {
    return <CenterLoader />;
  }
  return children;
};
