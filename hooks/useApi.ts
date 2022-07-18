import type { QueryKey, UseQueryOptions } from "react-query";
import { useQuery } from "react-query";

import type { DmError } from "@squonk/data-manager-client";

import type { AxiosError, AxiosRequestConfig } from "axios";
import axios from "axios";

const axiosInstance = axios.create({ baseURL: process.env.NEXT_PUBLIC_BASE_PATH + "/api" });

const axiosFetch = <T>(options: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source();

  const promise = axiosInstance({ ...options, cancelToken: source.token }).then(({ data }) => data);

  (promise as any).cancel = () => {
    source.cancel("Query was cancelled by React Query");
  };

  return promise;
};

// The first key is here to prevent collisions with @squonk/data-manager-api-client
const getKey = (url: string): QueryKey => ["api", url];

/**
 * General react-query hook to send requests to the /api (this app) route and not the /api/dm-api
 * (python app) route.
 */
export const useApi = <TData = any, TError = AxiosError<DmError>>(
  url: string,
  axiosConfig: AxiosRequestConfig = {},
  queryOptions?: UseQueryOptions<TData, TError, TData, QueryKey>,
) => {
  return useQuery<TData, TError>(
    getKey(url),
    () => axiosFetch<TData>({ ...axiosConfig, url }),
    queryOptions,
  );
};
