import { type AxiosError, type AxiosRequestConfig } from "axios";

import { createAxiosRuntime } from "../createAxiosRuntime";

const runtime = createAxiosRuntime();

export const AXIOS_INSTANCE = runtime.instance;
export const setAuthToken = runtime.setAuthToken;
export const setBaseUrl = runtime.setBaseUrl;

export const customInstance = <TReturn>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<TReturn> => runtime.request<TReturn>(config, options);

export type ErrorType<TError> = AxiosError<TError>;
