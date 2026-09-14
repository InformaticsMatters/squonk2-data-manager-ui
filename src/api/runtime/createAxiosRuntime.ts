import Axios, { type AxiosRequestConfig } from "axios";

export const createAxiosRuntime = () => {
  const instance = Axios.create();

  return {
    instance,
    setAuthToken: (token: string) => {
      instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    },
    setBaseUrl: (baseUrl: string) => {
      instance.defaults.baseURL = baseUrl;
    },
    request: <TReturn>(config: AxiosRequestConfig, options?: AxiosRequestConfig) =>
      instance.request<TReturn>({ ...config, ...options }).then(({ data }) => data),
  };
};
