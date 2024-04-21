import { type AxiosRequestConfig } from "axios";

export const dmOptions = (accessToken: string): AxiosRequestConfig => ({
  baseURL: process.env.DATA_MANAGER_API_SERVER,
  headers: { Authorization: `Bearer ${accessToken}` },
});

export const asOptions = (accessToken: string): AxiosRequestConfig => ({
  baseURL: process.env.ACCOUNT_SERVER_API_SERVER,
  headers: { Authorization: `Bearer ${accessToken}` },
});
