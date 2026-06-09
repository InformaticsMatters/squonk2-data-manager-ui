import { useEffect } from "react";

import { setAuthToken as setASAuthToken } from "@squonk/account-server-client";
import { setAuthToken as setDMAuthToken } from "@squonk/data-manager-client";

import { authClient } from "../lib/auth-client";
import { releaseTokenGate } from "../utils/api/tokenGate";

export const useSetupApiClients = () => {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session) {
      setDMAuthToken("");
      setASAuthToken("");
      releaseTokenGate();
      return;
    }

    void authClient
      .getAccessToken({ providerId: "keycloak" })
      .then(({ data }) => {
        const token = data?.accessToken ?? "";
        setDMAuthToken(token);
        setASAuthToken(token);
        releaseTokenGate();
      })
      .catch(() => {
        releaseTokenGate(); // don't hang requests forever on error
      });
  }, [session, isPending]);
};
