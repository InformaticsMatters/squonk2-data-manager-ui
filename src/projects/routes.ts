import {
  type ApplicationId,
  type InstanceId,
  isApplicationId,
  isInstanceId,
  isPositiveInteger,
  isProductId,
  isProjectId,
  isRunningWorkflowId,
  isTaskId,
  isWorkflowId,
  type PositiveIntegerString,
  type ProductId,
  type ProjectId,
  type RunningWorkflowId,
  type TaskId,
  type WorkflowId,
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

const viewers = ["text", "sdf", "browser"] as const;
const runFilterTypes = ["workflow", "application", "job"] as const;
const resultFilterTypes = ["workflow", "task", "instance"] as const;

const isJobId = (value: string): value is PositiveIntegerString =>
  isPositiveInteger(value) && Number.isSafeInteger(Number(value));

const definitionIdValidators = {
  applications: isApplicationId,
  jobs: isJobId,
  workflows: isWorkflowId,
} as const;

const resultIdValidators = {
  instances: isInstanceId,
  tasks: isTaskId,
  workflows: isRunningWorkflowId,
} as const;

export type FileViewer = (typeof viewers)[number];
export type RunDefinitionType = keyof typeof definitionIdValidators;
export type RunFilterType = (typeof runFilterTypes)[number];
export type ResultCollection = keyof typeof resultIdValidators;
export type ResultFilterType = (typeof resultFilterTypes)[number];

type SearchState = { search?: string };
type RunState = SearchState & { types?: readonly RunFilterType[] };
export type ResultsState = SearchState & { types?: readonly ResultFilterType[] };

type DefinitionIdByType = {
  applications: ApplicationId;
  jobs: PositiveIntegerString;
  workflows: WorkflowId;
};

type ResultIdByCollection = { instances: InstanceId; tasks: TaskId; workflows: RunningWorkflowId };

type RunDefinitionRoute = {
  [TType in RunDefinitionType]: RunState & {
    kind: "run-definition";
    projectId: ProjectId;
    definitionType: TType;
    definitionId: DefinitionIdByType[TType];
  };
}[RunDefinitionType];

type ResultRoute = {
  [TCollection in ResultCollection]: ResultsState & {
    kind: "result";
    projectId: ProjectId;
    collection: TCollection;
    resultId: ResultIdByCollection[TCollection];
  };
}[ResultCollection];

export type ProjectRoute =
  | ResultRoute
  | RunDefinitionRoute
  | { kind: "create"; subscriptionId?: ProductId }
  | { kind: "deletion"; taskId: TaskId; subscriptionId?: ProductId }
  | { kind: "file-view"; projectId: ProjectId; path: string; viewer?: FileViewer }
  | { kind: "files"; projectId: ProjectId; path?: string }
  | { kind: "manage"; projectId: ProjectId }
  | (ResultsState & { kind: "results"; projectId: ProjectId })
  | (RunState & { kind: "run"; projectId: ProjectId })
  | (SearchState & { kind: "index" });

const optionalSearch = (searchParams: URLSearchParams) =>
  readOptionalQuery(searchParams, "search", isSearch);

const parseFilterState = <TValue extends string>(
  searchParams: URLSearchParams,
  filterTypes: readonly TValue[],
): SearchState & { types?: readonly TValue[] } => {
  const search = optionalSearch(searchParams);
  const types = readEnumQuery(searchParams, "type", filterTypes);
  return { ...(search ? { search } : {}), ...(types ? { types } : {}) };
};

const parseRunState = (searchParams: URLSearchParams): RunState =>
  parseFilterState(searchParams, runFilterTypes);

const parseResultsState = (searchParams: URLSearchParams): ResultsState =>
  parseFilterState(searchParams, resultFilterTypes);

const canonicalEnumValues = <TValue extends string>(
  values: readonly TValue[] | undefined,
  order: readonly TValue[],
) => (values ? order.filter((value) => values.includes(value)) : undefined);

const parseSubscription = (searchParams: URLSearchParams) =>
  readOptionalQuery(searchParams, "subscription", isProductId);

const isDefinitionType = (value: string): value is RunDefinitionType =>
  Object.hasOwn(definitionIdValidators, value);

const parseDefinitionId = <TType extends RunDefinitionType>(
  type: TType,
  value: string,
): DefinitionIdByType[TType] | null =>
  definitionIdValidators[type](value) ? (value as DefinitionIdByType[TType]) : null;

const isResultCollection = (value: string): value is ResultCollection =>
  Object.hasOwn(resultIdValidators, value);

const parseResultId = <TCollection extends ResultCollection>(
  collection: TCollection,
  value: string,
): ResultIdByCollection[TCollection] | null =>
  resultIdValidators[collection](value) ? (value as ResultIdByCollection[TCollection]) : null;

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
        (value) => parseDefinitionId(definitionType, value) !== null,
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
        (value) => parseResultId(collection, value) !== null,
        `${collection} result ID`,
      )}`,
      [
        ["search", state.search && isSearch(state.search) ? state.search : undefined],
        ["type", canonicalEnumValues(state.types, resultFilterTypes)],
      ],
    ),
  manage: (projectId: string) => `/projects/${assertProjectId(projectId)}/manage`,
};

/**
 * The Results list state one Results route carries. Only Results owns these values, so nothing a
 * child link preserves can reach another section or another project.
 */
export const resultsListState = (
  route: Extract<ProjectRoute, { kind: "result" | "results" }>,
): ResultsState => ({
  ...(route.search ? { search: route.search } : {}),
  ...(route.types ? { types: route.types } : {}),
});

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
    const route: Extract<ProjectRoute, { kind: "create" }> = {
      kind: "create",
      ...(subscriptionId ? { subscriptionId } : {}),
    };
    return validRoute(location, route, projectLinks.create(route));
  }

  if (segments.length === 3 && segments[1] === "deletions") {
    const taskId = segments[2];
    if (!isTaskId(taskId)) {
      return notFoundRoute;
    }
    const subscriptionId = parseSubscription(searchParams);
    const route: Extract<ProjectRoute, { kind: "deletion" }> = {
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
    const definitionType = segments[3];
    if (!isDefinitionType(definitionType)) {
      return localNotFoundRoute("projects", "run", projectId);
    }
    const definitionId = parseDefinitionId(definitionType, segments[4]);
    if (!definitionId) {
      return localNotFoundRoute("projects", "run", projectId);
    }
    const state = parseRunState(searchParams);
    const route = {
      kind: "run-definition",
      projectId,
      definitionType,
      definitionId,
      ...state,
    } as RunDefinitionRoute;
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
    const collection = segments[3];
    if (!isResultCollection(collection)) {
      return localNotFoundRoute("projects", "results", projectId);
    }
    const resultId = parseResultId(collection, segments[4]);
    if (!resultId) {
      return localNotFoundRoute("projects", "results", projectId);
    }
    const state = parseResultsState(searchParams);
    const route = { kind: "result", projectId, collection, resultId, ...state } as ResultRoute;
    return validRoute(location, route, projectLinks.result(projectId, collection, resultId, state));
  }

  if (segments.length === 3 && segments[2] === "manage") {
    const route: ProjectRoute = { kind: "manage", projectId };
    return validRoute(location, route, projectLinks.manage(projectId));
  }

  return notFoundRoute;
};
