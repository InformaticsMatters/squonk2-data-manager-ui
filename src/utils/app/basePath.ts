const ensureLeadingSlash = (value: string): string => {
  return value.startsWith("/") ? value : `/${value}`;
};

const stripTrailingSlash = (value: string): string => {
  return value.replace(/\/+$/u, "");
};

/**
 * Normalizes the provided base path so it is either "" or starts with a single leading slash.
 * Trailing slashes are removed. Passing "/" returns an empty string as that is equivalent
 * to not setting a base path.
 */
export const getBasePath = (value = process.env.NEXT_PUBLIC_BASE_PATH): string => {
  if (!value) {
    return "";
  }

  const withLeadingSlash = ensureLeadingSlash(value);
  const trimmed = stripTrailingSlash(withLeadingSlash);

  return trimmed === "/" ? "" : trimmed;
};

/**
 * Prefixes the given path with the normalized base path.
 */
export const withBasePath = (
  path: string,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH,
): string => {
  const normalizedBasePath = getBasePath(basePath);
  if (path === "") {
    return normalizedBasePath;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBasePath}${normalizedPath}`;
};
