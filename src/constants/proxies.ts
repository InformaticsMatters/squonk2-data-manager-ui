import { withBasePath } from "../utils/app/basePath";

export const getDmApiUrl = (basePath = process.env.NEXT_PUBLIC_BASE_PATH): string => {
  return withBasePath("/api/dm-api", basePath);
};

export const getAsApiUrl = (basePath = process.env.NEXT_PUBLIC_BASE_PATH): string => {
  return withBasePath("/api/as-api", basePath);
};

export const DM_API_URL = getDmApiUrl();
export const AS_API_URL = getAsApiUrl();
