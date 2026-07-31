type LocalFailureSections = {
  administration: "charges" | "organisation-access" | "subscriptions" | "usage-inventory";
  datasets: "detail";
  projects: "files" | "results" | "run";
};

type RouteNotFoundParent = {
  [TFamily in keyof LocalFailureSections]: {
    family: TFamily;
    resourceId?: string;
    section: LocalFailureSections[TFamily];
  };
}[keyof LocalFailureSections];

export type RouteParseResult<TRoute> =
  | { kind: "not-found"; parent?: RouteNotFoundParent }
  | { kind: "valid"; route: TRoute; canonicalHref: string; needsReplace: boolean };

export type ParsedRouteLocation = {
  pathname: string;
  segments: string[];
  searchParams: URLSearchParams;
  sourceHref: string;
};

export const parseRouteLocation = (href: string): ParsedRouteLocation | null => {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(href, "https://route.invalid");
    const segments = url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));

    return {
      pathname: url.pathname,
      segments,
      searchParams: url.searchParams,
      sourceHref: `${url.pathname}${url.search}`,
    };
  } catch {
    return null;
  }
};

export const validRoute = <TRoute>(
  location: ParsedRouteLocation,
  route: TRoute,
  canonicalHref: string,
): RouteParseResult<TRoute> => ({
  kind: "valid",
  route,
  canonicalHref,
  needsReplace: location.sourceHref !== canonicalHref,
});

export const notFoundRoute = { kind: "not-found" } as const;

export const localNotFoundRoute = <TFamily extends keyof LocalFailureSections>(
  family: TFamily,
  section: LocalFailureSections[TFamily],
  resourceId?: string,
): RouteParseResult<never> => ({
  kind: "not-found",
  parent: { family, section, ...(resourceId ? { resourceId } : {}) } as RouteNotFoundParent,
});

export const buildHref = (
  pathname: string,
  entries: readonly (readonly [string, string | readonly string[] | undefined])[],
): string => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    if (typeof value === "string") {
      searchParams.append(key, value);
    } else if (value) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export function readOptionalQuery<TValue extends string>(
  searchParams: URLSearchParams,
  key: string,
  validate: (value: string) => value is TValue,
): TValue | undefined;
export function readOptionalQuery(
  searchParams: URLSearchParams,
  key: string,
  validate: (value: string) => boolean,
): string | undefined;
export function readOptionalQuery(
  searchParams: URLSearchParams,
  key: string,
  validate: (value: string) => boolean,
): string | undefined {
  const values = searchParams.getAll(key);
  return values.length === 1 && validate(values[0]) ? values[0] : undefined;
}

export const readRequiredQuery = (
  searchParams: URLSearchParams,
  key: string,
  validate: (value: string) => boolean,
): string | null => readOptionalQuery(searchParams, key, validate) ?? null;

export const readEnumQuery = <TValue extends string>(
  searchParams: URLSearchParams,
  key: string,
  orderedValues: readonly TValue[],
): TValue[] | undefined => {
  const values = searchParams.getAll(key);
  if (values.length === 0) {
    return undefined;
  }

  const allowed = new Set<string>(orderedValues);
  if (values.some((value) => !allowed.has(value))) {
    return undefined;
  }

  const selected = new Set(values);
  return orderedValues.filter((value) => selected.has(value));
};

export const readStringSetQuery = (
  searchParams: URLSearchParams,
  key: string,
  validate: (value: string) => boolean,
): string[] | undefined => {
  const values = searchParams.getAll(key);
  if (values.length === 0 || values.some((value) => !validate(value))) {
    return undefined;
  }

  return [...new Set(values)].toSorted((left, right) => left.localeCompare(right));
};

export const isSearch = (value: string): boolean => value.length > 0 && value.length <= 200;

export const isFileSystemPath = (value: string): boolean => {
  const hasControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
  if (!value.startsWith("/") || value.length > 260 || hasControlCharacter) {
    return false;
  }
  if (value === "/") {
    return true;
  }

  const parts = value.slice(1).split("/");
  return parts.every((part) => part.length > 0 && part !== "." && part !== "..");
};

export function assertRouteValue<TValue extends string>(
  value: string,
  validate: (candidate: string) => candidate is TValue,
  name: string,
): TValue;
export function assertRouteValue(
  value: string,
  validate: (candidate: string) => boolean,
  name: string,
): string;
export function assertRouteValue(
  value: string,
  validate: (candidate: string) => boolean,
  name: string,
): string {
  if (!validate(value)) {
    throw new TypeError(`Invalid ${name}`);
  }
  return value;
}
