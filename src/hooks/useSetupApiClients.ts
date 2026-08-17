import { useEffect, useState } from "react";

import { setAuthToken as setASAuthToken } from "@/api/account-server";
import { setAuthToken as setDMAuthToken } from "@/api/data-manager";

import { captureException } from "@sentry/nextjs";

import { authClient } from "../lib/auth-client";
import { releaseTokenGate } from "../utils/api/tokenGate";

/**
 * Why a signed-in caller has no access token, in the terms the auth server used.
 *
 * Recovery is the same whatever the answer — the session cannot authorise anything, so Keycloak is
 * asked again — but the answers are not the same thing at all: a rejected refresh means Keycloak
 * has ended this identity's session, an unreadable account means this deployment could not present
 * one, and an unauthorised call means the session went while it was being used. None of that can
 * be told apart after the fact, so the reason is carried here rather than swallowed.
 */
export class AccessTokenUnavailableError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(reason?: { code?: string; message?: string; status?: number }) {
    super(reason?.message ?? "The auth server returned no access token");
    this.name = "AccessTokenUnavailableError";
    this.code = reason?.code;
    this.status = reason?.status;
  }
}

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
      .then(({ data, error }) => {
        if (!isCurrent) {
          return;
        }
        const token = data?.accessToken;
        if (!token) {
          // The client resolves HTTP failures rather than rejecting them, so the server's answer
          // arrives here beside an absent token rather than in the catch.
          throw new AccessTokenUnavailableError(error ?? undefined);
        }
        setDMAuthToken(token);
        setASAuthToken(token);
        completeSetup("ready");
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }
        captureException(error);
        console.error("Could not obtain an access token for this session", error);
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
