// PROTOTYPE — throwaway. See ./UserMenuPrototype.tsx for the question being answered.
import { atom, useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/router";

import { useASAuthorizationStatus, useDMAuthorizationStatus } from "../../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { eventStreamSidebarOpenAtom } from "../../../state/eventStream";
import { useUnreadEventCount } from "../../../state/notifications";

/** Open state of the prototype user menu, shared so variants can render outside the toolbar. */
export const userMenuOpenAtom = atom(false);

export const useUserMenuOpen = () => useAtom(userMenuOpenAtom);
export const useUserMenuIsOpen = () => useAtomValue(userMenuOpenAtom);

/** Everything the account surface needs, in one place so each variant is free to lay it out. */
export const useAccountSummary = () => {
  const { user, isLoading, error } = useKeycloakUser();
  const dmRole = useDMAuthorizationStatus();
  const asRole = useASAuthorizationStatus();
  const { count, resetCount } = useUnreadEventCount();
  const [isSidebarOpen, setSidebarOpen] = useAtom(eventStreamSidebarOpenAtom);

  // `?fakeUser=1` fills in a signed-in caller so the arrangements can be judged without a
  // Keycloak session. Read-only stub — nothing is sent anywhere.
  const { query } = useRouter();
  if (query.fakeUser) {
    return {
      user: { ...user, username: "odudgeon", email: "user@informaticsmatters.com" },
      isLoading: false,
      error: null,
      dmRole: "data-manager-admin",
      asRole: "account-server-admin",
      count: count || 7,
      resetCount,
      isSidebarOpen,
      setSidebarOpen,
      signedIn: true,
    };
  }

  return {
    user,
    isLoading,
    error,
    dmRole,
    asRole,
    count,
    resetCount,
    isSidebarOpen,
    setSidebarOpen,
    signedIn: !!user.username,
  };
};
