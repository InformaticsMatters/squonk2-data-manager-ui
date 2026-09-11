/**
 * How preparation talks to the live services as a named identity: no browser, no application. What
 * the application does with these services is what the journey itself is there to exercise.
 *
 * These endpoints are read through functions rather than captured as constants, because
 * `tests/liveEnvironment.ts` loads `.env.test.local` as it is imported by the config, and that
 * happens after this module is evaluated.
 */
export const accountServer = () => process.env.ACCOUNT_SERVER_API_SERVER as string;
export const dataManager = () => process.env.DATA_MANAGER_API_SERVER as string;

/**
 * A Keycloak direct-access-grant token for one identity.
 *
 * The `openid` scope is what makes the Account Server read the token's scopes at all. Without it
 * the same credentials are answered `403` on resources such as `/personal-unit`, claiming the
 * token carries no scopes, while `/organisation` still succeeds.
 *
 * `offline_access` is deliberately not asked for. Preparation's reads and deletes are over in
 * seconds and never refresh, and Keycloak refuses the whole grant — `not_allowed`, "Offline tokens
 * not allowed" — for any identity without that realm role, which is not one every test identity
 * has.
 */
export const accessTokenFor = async (username: string, password: string) => {
  const response = await fetch(
    `${process.env.KEYCLOAK_URL as string}/protocol/openid-connect/token`,
    {
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID as string,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
        grant_type: "password",
        password,
        scope: "openid profile email",
        username,
      }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(
      `Keycloak refused ${username} with ${response.status}: ${await response.text()}`,
    );
  }
  return ((await response.json()) as { access_token: string }).access_token;
};

/** A service call made as an identity, which fails the run rather than returning a bad answer. */
export const asIdentity = async <T>(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url} answered ${response.status}: ${body}`);
  }
  return (body ? JSON.parse(body) : undefined) as T;
};
