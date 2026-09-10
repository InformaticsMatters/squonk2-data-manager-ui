import Axios, { type AxiosRequestConfig } from "axios";

export const createAxiosRuntime = () => {
  const instance = Axios.create();

  return {
    instance,
    /**
     * Present the caller's credentials on every request, or present none at all.
     *
     * An empty token is not a credential. Writing one anyway sends `Bearer ` — a header the API can
     * only reject, and one that reads in a network log as a token that went missing somewhere in
     * this application rather than as a caller who has none. The header is removed instead, so a
     * request made without a token is plainly unauthenticated.
     */
    setAuthToken: (token: string) => {
      if (token) {
        instance.defaults.headers.common.Authorization = `Bearer ${token}`;
        return;
      }
      delete instance.defaults.headers.common.Authorization;
    },
    setBaseUrl: (baseUrl: string) => {
      instance.defaults.baseURL = baseUrl;
    },
    request: <TReturn>(config: AxiosRequestConfig, options?: AxiosRequestConfig) =>
      instance.request<TReturn>({ ...config, ...options }).then(({ data }) => data),
  };
};
