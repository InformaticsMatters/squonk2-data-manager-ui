import { type ReactNode, useEffect, useRef, useState } from "react";

import { Alert } from "@mui/material";
import { captureMessage } from "@sentry/nextjs";

import { AuthButton } from "../components/auth/AuthButton";
import { CenterLoader } from "../components/CenterLoader";
import { useSetupApiClients } from "../hooks/useSetupApiClients";
import { authClient } from "../lib/auth-client";
import {
  claimApiClientReauthentication,
  forgetApiClientReauthentication,
} from "./apiClientRecovery";

export const ApiClientSetup = () => {
  useSetupApiClients();
  return null;
};

export const ApiClientReadyBoundary = ({ children }: { children: ReactNode }) => {
  const status = useSetupApiClients();
  // Whether this mount has already decided what to do about a failure. The claim itself is spent
  // once for the whole tab, so re-entering the effect must not read a claim this boundary made as
  // an attempt some earlier boundary made and exhausted.
  const decided = useRef(false);
  const [reauthenticationSpent, setReauthenticationSpent] = useState(false);

  useEffect(() => {
    if (status === "ready") {
      // This boundary only mounts beneath AuthenticationBoundary, so a session is always present
      // here and readiness means a token was obtained for it rather than that nobody is signed in.
      decided.current = false;
      forgetApiClientReauthentication(sessionStorage);
      return;
    }
    if (status !== "error" || decided.current) {
      return;
    }
    decided.current = true;
    if (!claimApiClientReauthentication(sessionStorage)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reports what spending the tab-wide claim in session storage just answered; nothing about it can be derived during render
      setReauthenticationSpent(true);
      return;
    }
    // Discarding the session is the whole recovery. AuthenticationBoundary already owns what a
    // page without a session does, and signs in again at the address the caller asked for, so
    // there is no second redirect here that could disagree with it about where the caller was.
    void authClient.signOut().then(
      ({ error }) => {
        if (error) {
          setReauthenticationSpent(true);
        }
      },
      () => setReauthenticationSpent(true),
    );
  }, [status]);

  useEffect(() => {
    if (reauthenticationSpent) {
      // Signing in again is the recovery for a session that cannot authorise the clients, so the
      // individual refusals are ordinary and are only logged. One that survives the recovery is
      // not: the deployment is handing out sessions no amount of signing in makes usable, which is
      // the state worth being told about.
      captureMessage("A session could not authorise the API clients after signing in again");
    }
  }, [reauthenticationSpent]);

  if (status === "error" && reauthenticationSpent) {
    return (
      <Alert
        action={<AuthButton color="inherit" mode="logout" size="small" />}
        severity="error"
        // Signing in again has already been tried and did not produce a usable token, so the only
        // thing left that can is ending the identity provider's session too.
      >
        This session cannot authorise the API clients. Log out and log in again to continue.
      </Alert>
    );
  }
  if (status !== "ready") {
    return <CenterLoader />;
  }
  return children;
};
