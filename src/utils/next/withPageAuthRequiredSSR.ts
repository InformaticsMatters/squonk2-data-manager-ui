import { fromNodeHeaders } from "better-auth/node";
import { type GetServerSidePropsContext, type GetServerSidePropsResult } from "next";

import { auth } from "../../lib/auth";
import { withBasePath } from "../app/basePath";

type InnerGSSP<T> = (ctx: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<T>>;

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
        const location = signInRes.headers.get("location");
        if (location) {
          const setCookie = signInRes.headers.get("set-cookie");
          if (setCookie) {
            ctx.res.setHeader("Set-Cookie", setCookie);
          }
          return { redirect: { destination: location, permanent: false } };
        }
      } catch {
        // fallback: home page redirect, CSR HOC will re-initiate login
      }

      return { redirect: { destination: withBasePath("/"), permanent: false } };
    }

    return options.getServerSideProps(ctx);
  };
}
