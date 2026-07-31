import {
  isApplicationId,
  isInstanceId,
  isPositiveInteger,
  isProductId,
  isProjectId,
  isRunningWorkflowId,
  isTaskId,
  isWorkflowId,
} from "../routing/identifiers";
import {
  assertRouteValue,
  buildHref,
  isFileSystemPath,
  isSearch,
  localNotFoundRoute,
  notFoundRoute,
  parseRouteLocation,
  readEnumQuery,
  readOptionalQuery,
  readRequiredQuery,
  type RouteParseResult,
  validRoute,
} from "../routing/routeContract";

export type FileViewer = "browser" | "sdf" | "text";
export type RunDefinitionType = "applications" | "jobs" | "workflows";
export type RunFilterType = "application" | "job" | "workflow";
export type ResultCollection = "instances" | "tasks" | "workflows";
export type ResultFilterType = "instance" | "task" | "workflow";

type SearchState = { search?: string };
type RunState = SearchState & { types?: readonly RunFilterType[] };
type ResultsState = SearchState & { types?: readonly ResultFilterType[] };

export type ProjectRoute =
  | { kind: "create"; subscriptionId?: string }
  | { kind: "deletion"; taskId: string; subscriptionId?: string }
  | { kind: "file-view"; projectId: string; path: string; viewer?: FileViewer }
  | { kind: "files"; projectId: string; path?: string }
  | { kind: "manage"; projectId: string }
  | (ResultsState & {
      kind: "result";
      projectId: string;
      collection: ResultCollection;
      resultId: string;
    })
  | (ResultsState & { kind: "results"; projectId: string })
  | (RunState & {
      kind: "run-definition";
      projectId: string;
      definitionType: RunDefinitionType;
      definitionId: string;
    })
  | (RunState & { kind: "run"; projectId: string })
  | (SearchState & { kind: "index" });

const viewers = ["text", "sdf", "browser"] as const;
const runFilterTypes = ["workflow", "application", "job"] as const;
const resultFilterTypes = ["workflow", "task", "instance"] as const;

const optionalSearch = (searchParams: URLSearchParams) =>
  readOptionalQuery(searchParams, "search", isSearch);

const parseRunState = (searchParams: URLSearchParams): RunState => {
  const search = optionalSearch(searchParams);
  const types = readEnumQuery(searchParams, "type", runFilterTypes);
  return { ...(search ? { search } : {}), ...(types ? { types } : {}) };
};

const parseResultsState = (searchParams: URLSearchParams): ResultsState => {
  const search = optionalSearch(searchParams);
  const types = readEnumQuery(searchParams, "type", resultFilterTypes);
  return { ...(search ? { search } : {}), ...(types ? { types } : {}) };
};

const canonicalEnumValues = <TValue extends string>(
  values: readonly TValue[] | undefined,
  order: readonly TValue[],
) => (values ? order.filter((value) => values.includes(value)) : undefined);

const parseSubscription = (searchParams: URLSearchParams) =>
  readOptionalQuery(searchParams, "subscription", isProductId);

const definitionIdIsValid = (type: RunDefinitionType, value: string): boolean => {
  switch (type) {
    case "jobs":
      return isPositiveInteger(value) && Number.isSafeInteger(Number(value));
    case "applications":
      return isApplicationId(value);
    case "workflows":
      return isWorkflowId(value);
  }
};

const resultIdIsValid = (collection: ResultCollection, value: string): boolean => {
  switch (collection) {
    case "tasks":
      return isTaskId(value);
    case "instances":
      return isInstanceId(value);
    case "workflows":
      return isRunningWorkflowId(value);
  }
};

const assertProjectId = (value: string) => assertRouteValue(value, isProjectId, "project ID");

export const projectLinks = {
  index: (state: SearchState = {}) =>
    buildHref("/projects", [
      ["search", state.search && isSearch(state.search) ? state.search : undefined],
    ]),
  create: ({ subscriptionId }: { subscriptionId?: string } = {}) =>
    buildHref("/projects/new", [
      [
        "subscription",
        subscriptionId
          ? assertRouteValue(subscriptionId, isProductId, "subscription product ID")
          : undefined,
      ],
    ]),
  deletion: (taskId: string, { subscriptionId }: { subscriptionId?: string } = {}) =>
    buildHref(`/projects/deletions/${assertRouteValue(taskId, isTaskId, "deletion task ID")}`, [
      [
        "subscription",
        subscriptionId
          ? assertRouteValue(subscriptionId, isProductId, "subscription product ID")
          : undefined,
      ],
    ]),
  entry: (projectId: string) => `/projects/${assertProjectId(projectId)}`,
  files: (projectId: string, { path }: { path?: string } = {}) =>
    buildHref(`/projects/${assertProjectId(projectId)}/files`, [
      ["path", path ? assertRouteValue(path, isFileSystemPath, "filesystem path") : undefined],
    ]),
  fileView: (projectId: string, { path, viewer }: { path: string; viewer?: FileViewer }) =>
    buildHref(`/projects/${assertProjectId(projectId)}/files/view`, [
      [
        "path",
        assertRouteValue(path, (value) => isFileSystemPath(value) && value !== "/", "file path"),
      ],
      ["viewer", viewer],
    ]),
  run: (projectId: string, state: RunState = {}) =>
    buildHref(`/projects/${assertProjectId(projectId)}/run`, [
      ["search", state.search && isSearch(state.search) ? state.search : undefined],
      ["type", canonicalEnumValues(state.types, runFilterTypes)],
    ]),
  runDefinition: (
    projectId: string,
    definitionType: RunDefinitionType,
    definitionId: string,
    state: RunState = {},
  ) =>
    buildHref(
      `/projects/${assertProjectId(projectId)}/run/${definitionType}/${assertRouteValue(
        definitionId,
        (value) => definitionIdIsValid(definitionType, value),
        `${definitionType} definition ID`,
      )}`,
      [
        ["search", state.search && isSearch(state.search) ? state.search : undefined],
        ["type", canonicalEnumValues(state.types, runFilterTypes)],
      ],
    ),
  results: (projectId: string, state: ResultsState = {}) =>
    buildHref(`/projects/${assertProjectId(projectId)}/results`, [
      ["search", state.search && isSearch(state.search) ? state.search : undefined],
      ["type", canonicalEnumValues(state.types, resultFilterTypes)],
    ]),
  result: (
    projectId: string,
    collection: ResultCollection,
    resultId: string,
    state: ResultsState = {},
  ) =>
    buildHref(
      `/projects/${assertProjectId(projectId)}/results/${collection}/${assertRouteValue(
        resultId,
        (value) => resultIdIsValid(collection, value),
        `${collection} result ID`,
      )}`,
      [
        ["search", state.search && isSearch(state.search) ? state.search : undefined],
        ["type", canonicalEnumValues(state.types, resultFilterTypes)],
      ],
    ),
  manage: (projectId: string) => `/projects/${assertProjectId(projectId)}/manage`,
};

export const parseProjectRoute = (href: string): RouteParseResult<ProjectRoute> => {
  const location = parseRouteLocation(href);
  if (location?.segments[0] !== "projects") {
    return notFoundRoute;
  }

  const { searchParams, segments } = location;
  if (segments.length === 1) {
    const search = optionalSearch(searchParams);
    const route: ProjectRoute = { kind: "index", ...(search ? { search } : {}) };
    return validRoute(location, route, projectLinks.index(route));
  }

  if (segments.length === 2 && segments[1] === "new") {
    const subscriptionId = parseSubscription(searchParams);
    const route: ProjectRoute = { kind: "create", ...(subscriptionId ? { subscriptionId } : {}) };
    return validRoute(location, route, projectLinks.create(route));
  }

  if (segments.length === 3 && segments[1] === "deletions") {
    const taskId = segments[2];
    if (!isTaskId(taskId)) {
      return notFoundRoute;
    }
    const subscriptionId = parseSubscription(searchParams);
    const route: ProjectRoute = {
      kind: "deletion",
      taskId,
      ...(subscriptionId ? { subscriptionId } : {}),
    };
    return validRoute(location, route, projectLinks.deletion(taskId, route));
  }

  const projectId = segments[1];
  if (!isProjectId(projectId)) {
    return notFoundRoute;
  }

  if (segments.length === 2) {
    const route: ProjectRoute = { kind: "files", projectId };
    return validRoute(location, route, projectLinks.files(projectId));
  }

  if (segments.length === 3 && segments[2] === "files") {
    const path = readOptionalQuery(searchParams, "path", isFileSystemPath);
    const route: ProjectRoute = { kind: "files", projectId, ...(path ? { path } : {}) };
    return validRoute(location, route, projectLinks.files(projectId, route));
  }

  if (segments.length === 4 && segments[2] === "files" && segments[3] === "view") {
    const path = readRequiredQuery(
      searchParams,
      "path",
      (value) => isFileSystemPath(value) && value !== "/",
    );
    if (!path) {
      return localNotFoundRoute("projects", "files", projectId);
    }
    const viewer = readOptionalQuery(searchParams, "viewer", (value) =>
      viewers.includes(value as FileViewer),
    ) as FileViewer | undefined;
    const route: ProjectRoute = {
      kind: "file-view",
      projectId,
      path,
      ...(viewer ? { viewer } : {}),
    };
    return validRoute(location, route, projectLinks.fileView(projectId, route));
  }

  if (segments.length === 3 && segments[2] === "run") {
    const state = parseRunState(searchParams);
    const route: ProjectRoute = { kind: "run", projectId, ...state };
    return validRoute(location, route, projectLinks.run(projectId, state));
  }

  if (segments.length === 5 && segments[2] === "run") {
    const definitionType = segments[3] as RunDefinitionType;
    const definitionId = segments[4];
    if (
      !(["jobs", "applications", "workflows"] as const).includes(definitionType) ||
      !definitionIdIsValid(definitionType, definitionId)
    ) {
      return localNotFoundRoute("projects", "run", projectId);
    }
    const state = parseRunState(searchParams);
    const route: ProjectRoute = {
      kind: "run-definition",
      projectId,
      definitionType,
      definitionId,
      ...state,
    };
    return validRoute(
      location,
      route,
      projectLinks.runDefinition(projectId, definitionType, definitionId, state),
    );
  }

  if (segments.length === 3 && segments[2] === "results") {
    const state = parseResultsState(searchParams);
    const route: ProjectRoute = { kind: "results", projectId, ...state };
    return validRoute(location, route, projectLinks.results(projectId, state));
  }

  if (segments.length === 5 && segments[2] === "results") {
    const collection = segments[3] as ResultCollection;
    const resultId = segments[4];
    if (
      !(["tasks", "instances", "workflows"] as const).includes(collection) ||
      !resultIdIsValid(collection, resultId)
    ) {
      return localNotFoundRoute("projects", "results", projectId);
    }
    const state = parseResultsState(searchParams);
    const route: ProjectRoute = { kind: "result", projectId, collection, resultId, ...state };
    return validRoute(location, route, projectLinks.result(projectId, collection, resultId, state));
  }

  if (segments.length === 3 && segments[2] === "manage") {
    const route: ProjectRoute = { kind: "manage", projectId };
    return validRoute(location, route, projectLinks.manage(projectId));
  }

  return notFoundRoute;
};
