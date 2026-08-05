import { fromNodeHeaders } from "better-auth/node";
import { type GetServerSidePropsContext, type GetServerSidePropsResult } from "next";

import { auth } from "../../lib/auth";
import { withBasePath } from "../app/basePath";

type InnerGSSP<T> = (ctx: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<T>>;

/**
 * Reads where the provider wants the browser sent. Better Auth answers this endpoint with a JSON
 * authorization URL rather than a redirect, so the header is only a fallback.
 */
const readAuthorizationUrl = async (response: Response) => {
  const location = response.headers.get("location");
  if (location) {
    return location;
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  const body = (await response.json()) as { url?: unknown };
  return typeof body.url === "string" ? body.url : null;
};

export function withPageAuthRequiredSSR<T>(options: {
  returnTo?: string;
  getServerSideProps: InnerGSSP<T>;
}) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<T>> => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(ctx.req.headers) });

    if (!session) {
      const returnTo = options.returnTo ?? withBasePath(ctx.resolvedUrl);
      const baseUrl =
        process.env.BETTER_AUTH_BASE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`;

      try {
        const signInRes = await auth.handler(
          new Request(`${baseUrl}/api/auth/sign-in/oauth2`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ providerId: "keycloak", callbackURL: returnTo }),
          }),
        );
        // getSetCookie keeps each cookie separate; headers.get would join them into one
        // malformed header and lose the OAuth state that carries the PKCE code verifier
        const setCookies = signInRes.headers.getSetCookie();
        const destination = await readAuthorizationUrl(signInRes);
        if (destination) {
          if (setCookies.length > 0) {
            ctx.res.setHeader("Set-Cookie", setCookies);
          }
          return { redirect: { destination, permanent: false } };
        }
      } catch {
        // fallback: home page redirect, CSR HOC will re-initiate login
      }

      // Next prefixes internal redirect destinations with the base path itself.
      return { redirect: { destination: "/", permanent: false } };
    }

    return options.getServerSideProps(ctx);
  };
}
