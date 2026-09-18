export const API_CLIENT_REAUTHENTICATION_KEY = "data-manager-ui-api-client-reauthentication";

/**
 * Whether this tab may still sign in again to recover a session that cannot authorise the clients.
 *
 * A session can outlive the tokens behind it. The stored account that holds the Keycloak tokens is
 * cached in a cookie for minutes and otherwise lives only in the process that wrote it, while the
 * session itself is renewed on every read and lasts days; a refresh token can also be rejected long
 * before the session it belongs to expires. Either way the session is worthless to the API clients
 * and only signing in again produces one that is not, so a page that requires the clients discards
 * the session rather than stating a failure the caller can do nothing about.
 *
 * The claim is what keeps that recovery from becoming a redirect loop: a tab that has already
 * signed in again and still cannot obtain a token has learnt that signing in again does not help.
 * It is released as soon as a token is obtained, so a session that dies later in the same tab
 * recovers on its own terms instead of inheriting the previous one's spent attempt.
 */
export const claimApiClientReauthentication = (
  storage: Pick<Storage, "getItem" | "setItem">,
): boolean => {
  if (storage.getItem(API_CLIENT_REAUTHENTICATION_KEY) !== null) {
    return false;
  }
  storage.setItem(API_CLIENT_REAUTHENTICATION_KEY, "attempted");
  return true;
};

export const forgetApiClientReauthentication = (storage: Pick<Storage, "removeItem">) => {
  storage.removeItem(API_CLIENT_REAUTHENTICATION_KEY);
};
