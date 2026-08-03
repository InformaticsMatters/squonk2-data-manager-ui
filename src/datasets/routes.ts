import { appApiDatasetGetQueryUsernameRegExp } from "@/api/data-manager/dataset/zod";

import { type DatasetId, isDatasetId, isDatasetVersion } from "../routing/identifiers";
import {
  assertRouteValue,
  buildHref,
  isSearch,
  localNotFoundRoute,
  notFoundRoute,
  parseRouteLocation,
  readOptionalQuery,
  readStringSetQuery,
  type RouteParseResult,
  validRoute,
} from "../routing/routeContract";

export type DatasetListState = {
  search?: string;
  owner?: string;
  editor?: string;
  mimeType?: string;
  labels?: readonly string[];
};

export type DatasetRoute =
  | (DatasetListState & { kind: "dataset"; datasetId: DatasetId })
  | (DatasetListState & { kind: "index" })
  | (DatasetListState & { kind: "version"; datasetId: DatasetId; datasetVersion: number })
  | (DatasetListState & { kind: "viewer"; datasetId: DatasetId; datasetVersion: number });

const isUsername = (value: string) =>
  value.length >= 3 && value.length <= 80 && appApiDatasetGetQueryUsernameRegExp.test(value);
const isMimeType = (value: string) =>
  value.length > 0 && value.length <= 255 && value.includes("/");
const isLabel = (value: string) => value.length > 0 && value.length <= 200;

const parseListState = (searchParams: URLSearchParams): DatasetListState => {
  const search = readOptionalQuery(searchParams, "search", isSearch);
  const owner = readOptionalQuery(searchParams, "owner", isUsername);
  const editor = readOptionalQuery(searchParams, "editor", isUsername);
  const mimeType = readOptionalQuery(searchParams, "type", isMimeType);
  const labels = readStringSetQuery(searchParams, "label", isLabel);
  return {
    ...(search ? { search } : {}),
    ...(owner ? { owner } : {}),
    ...(editor ? { editor } : {}),
    ...(mimeType ? { mimeType } : {}),
    ...(labels ? { labels } : {}),
  };
};

const listStateEntries = (state: DatasetListState) =>
  [
    ["search", state.search && isSearch(state.search) ? state.search : undefined],
    ["owner", state.owner && isUsername(state.owner) ? state.owner : undefined],
    ["editor", state.editor && isUsername(state.editor) ? state.editor : undefined],
    ["type", state.mimeType && isMimeType(state.mimeType) ? state.mimeType : undefined],
    [
      "label",
      state.labels?.every((label) => isLabel(label))
        ? [...new Set(state.labels)].toSorted((left, right) => left.localeCompare(right))
        : undefined,
    ],
  ] as const;

const assertDatasetId = (value: string) => assertRouteValue(value, isDatasetId, "dataset ID");
const assertVersion = (value: number): number => {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError("Invalid dataset version");
  }
  return value;
};

export const datasetLinks = {
  index: (state: DatasetListState = {}) => buildHref("/datasets", listStateEntries(state)),
  dataset: (datasetId: string, state: DatasetListState = {}) =>
    buildHref(`/datasets/${assertDatasetId(datasetId)}`, listStateEntries(state)),
  version: (datasetId: string, datasetVersion: number, state: DatasetListState = {}) =>
    buildHref(
      `/datasets/${assertDatasetId(datasetId)}/versions/${assertVersion(datasetVersion)}`,
      listStateEntries(state),
    ),
  view: (datasetId: string, datasetVersion: number, state: DatasetListState = {}) =>
    buildHref(
      `/datasets/${assertDatasetId(datasetId)}/versions/${assertVersion(datasetVersion)}/view`,
      listStateEntries(state),
    ),
};

export const datasetListState = (route: DatasetRoute): DatasetListState => ({
  ...(route.search ? { search: route.search } : {}),
  ...(route.owner ? { owner: route.owner } : {}),
  ...(route.editor ? { editor: route.editor } : {}),
  ...(route.mimeType ? { mimeType: route.mimeType } : {}),
  ...(route.labels ? { labels: route.labels } : {}),
});

export const datasetRouteHref = (route: DatasetRoute, state = datasetListState(route)) => {
  switch (route.kind) {
    case "index":
      return datasetLinks.index(state);
    case "dataset":
      return datasetLinks.dataset(route.datasetId, state);
    case "version":
      return datasetLinks.version(route.datasetId, route.datasetVersion, state);
    case "viewer":
      return datasetLinks.view(route.datasetId, route.datasetVersion, state);
  }
};

export const parseDatasetRoute = (href: string): RouteParseResult<DatasetRoute> => {
  const location = parseRouteLocation(href);
  if (location?.segments[0] !== "datasets") {
    return notFoundRoute;
  }

  const { segments } = location;
  const state = parseListState(location.searchParams);
  if (segments.length === 1) {
    const route: DatasetRoute = { kind: "index", ...state };
    return validRoute(location, route, datasetLinks.index(state));
  }

  const datasetId = segments[1];
  if (!isDatasetId(datasetId)) {
    return notFoundRoute;
  }

  if (segments.length === 2) {
    const route: DatasetRoute = { kind: "dataset", datasetId, ...state };
    return validRoute(location, route, datasetLinks.dataset(datasetId, state));
  }

  if (
    (segments.length === 4 || (segments.length === 5 && segments[4] === "view")) &&
    segments[2] === "versions" &&
    isDatasetVersion(segments[3])
  ) {
    const datasetVersion = Number(segments[3]);
    if (segments.length === 4) {
      const route: DatasetRoute = { kind: "version", datasetId, datasetVersion, ...state };
      return validRoute(location, route, datasetLinks.version(datasetId, datasetVersion, state));
    }
    const route: DatasetRoute = { kind: "viewer", datasetId, datasetVersion, ...state };
    return validRoute(location, route, datasetLinks.view(datasetId, datasetVersion, state));
  }

  if (segments[2] === "versions") {
    return localNotFoundRoute("datasets", "detail", datasetId);
  }

  return notFoundRoute;
};
