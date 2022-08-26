import type { AxiosRequestConfig } from "axios";

export const dmOptions = (accessToken: string): AxiosRequestConfig => ({
  baseURL: process.env.DATA_MANAGER_API_SERVER,
  headers: { Authorization: `Bearer ${accessToken}` },
});
