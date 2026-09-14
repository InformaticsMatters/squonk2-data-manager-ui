import { createFetchRuntime } from "../createFetchRuntime";

const runtime = createFetchRuntime();

export const setBaseURL = runtime.setBaseURL;
export const getBaseURL = runtime.getBaseURL;

export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> =>
  runtime.request<T>(url, options);

export type ErrorType<Error> = Error;
