import { type GetServerSidePropsContext } from "nextjs-routes";

import { withBasePath } from "../app/basePath";

export const getFullReturnTo = (ctx: GetServerSidePropsContext): string => {
  return withBasePath(ctx.resolvedUrl);
};
