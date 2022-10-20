import type { DehydratedState } from "@tanstack/react-query";

export interface NotSuccessful {
  statusCode: number;
  statusMessage: string;
}

export interface ReactQueryPageProps {
  dehydratedState: DehydratedState;
}

export type CustomPageProps<T> = T | NotSuccessful;

export const isNotSuccessful = <T>(props: CustomPageProps<T>): props is NotSuccessful => {
  return typeof (props as NotSuccessful).statusCode === "number";
};
