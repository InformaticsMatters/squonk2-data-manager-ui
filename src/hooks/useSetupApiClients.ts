import { useEffect, useState } from "react";

import { setAuthToken as setASAuthToken } from "@/api/account-server";
import { setAuthToken as setDMAuthToken } from "@/api/data-manager";

import { authClient } from "../lib/auth-client";
import { releaseTokenGate } from "../utils/api/tokenGate";

export const useSetupApiClients = () => {
  const { data: session, isPending } = authClient.useSession();
  const [status, setStatus] = useState<"error" | "pending" | "ready">("pending");

  useEffect(() => {
    let isCurrent = true;
    setStatus("pending");

    if (isPending) {
      return () => {
        isCurrent = false;
      };
    }

    const completeSetup = (result: "error" | "ready") => {
      releaseTokenGate();
      if (isCurrent) {
        setStatus(result);
      }
    };

    if (!session) {
      setDMAuthToken("");
      setASAuthToken("");
      completeSetup("ready");
      return () => {
        isCurrent = false;
      };
    }

    void authClient
      .getAccessToken({ providerId: "keycloak" })
      .then(({ data }) => {
        if (!isCurrent) {
          return;
        }
        const token = data?.accessToken;
        if (!token) {
          throw new Error("No access token returned");
        }
        setDMAuthToken(token);
        setASAuthToken(token);
        completeSetup("ready");
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }
        setDMAuthToken("");
        setASAuthToken("");
        completeSetup("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [session, isPending]);

  return status;
};
