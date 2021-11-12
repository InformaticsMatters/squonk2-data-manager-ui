export type QueryParamsObject = Record<string, any>;

/**
 * Creates a query params string from a JSON object, ignoring undefined values.
 *
 * Examples:
 * * `{a: 10, b: 'test'}           -> '?a=10&b=test'`
 * * `{a: undefined, b: 'test'}    -> '?b=test'`
 * * `{a: undefined, b: undefined} -> ''`
 */
export const getQueryParams = (params: QueryParamsObject) => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  return queryString ? `?${queryString}` : '';
};
