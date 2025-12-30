import { type DehydratedState } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "nextjs-routes";

import { withBasePath } from "../app/basePath";

export const getFullReturnTo = (ctx: GetServerSidePropsContext): string => {
  return withBasePath(ctx.resolvedUrl);
};

export interface NotSuccessful {
  statusCode: number;
  statusMessage: string;
}

export interface ReactQueryPageProps {
  dehydratedState: DehydratedState;
}

export type CustomPageProps<T> = NotSuccessful | T;

export const isNotSuccessful = <T>(props: CustomPageProps<T>): props is NotSuccessful => {
  return typeof (props as NotSuccessful).statusCode === "number";
};
