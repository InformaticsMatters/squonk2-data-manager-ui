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
  isSearch,
  localNotFoundRoute,
  notFoundRoute,
  parseRouteLocation,
  readEnumQuery,
  readOptionalQuery,
  readRequiredQuery,
  type RouteNotFoundParent,
  type RouteParseResult,
  validRoute,
} from "../routing/routeContract";
import { canonicalFilesystemPath, filesystemRoot } from "./fileFacts";

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
export type RunState = SearchState & { types?: readonly RunFilterType[] };
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

/**
 * The list state a section carries, built the same way whether it was read from a URL or taken
 * from an already-parsed route, so a route and the link that rebuilds it can never disagree about
 * which values a section owns.
 */
const filterState = <TValue extends string>(
  search: string | undefined,
  types: readonly TValue[] | undefined,
): SearchState & { types?: readonly TValue[] } => ({
  ...(search ? { search } : {}),
  // A state that narrows to no type narrows to nothing at all, so it is the same absent value the
  // link builder and the list already read it as.
  ...(types?.length ? { types } : {}),
});

const parseFilterState = <TValue extends string>(
  searchParams: URLSearchParams,
  filterTypes: readonly TValue[],
) => filterState(optionalSearch(searchParams), readEnumQuery(searchParams, "type", filterTypes));

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

/** The one way a section's search value reaches a link, so a malformed one is never written. */
const searchQuery = (search: string | undefined) =>
  [["search", search && isSearch(search) ? search : undefined]] as const;

/**
 * The query state a filtered list owns. Every link that preserves a list's state writes it through
 * here, so the canonical order of the types is decided in one place.
 */
const filterQuery = <TValue extends string>(
  state: SearchState & { types?: readonly TValue[] },
  order: readonly TValue[],
) => [...searchQuery(state.search), ["type", canonicalEnumValues(state.types, order)]] as const;

const namesFilesystemPath = (value: string) => canonicalFilesystemPath(value) !== null;

/** The canonical spelling of a path, or a rejection naming what it was supposed to be. */
const canonicalPathOrThrow = (path: string, name: string) => {
  const canonical = canonicalFilesystemPath(path);
  if (canonical === null) {
    throw new TypeError(`Invalid ${name}`);
  }
  return canonical;
};

/**
 * The one way a directory reaches a Files link. The root is the section's own default rather than a
 * value the URL carries, so a link to it and a link that spells it out are the same link, and
 * anything that cannot name a directory at all is rejected instead of being written into a URL.
 */
const directoryQuery = (path: string | undefined) => {
  if (path === undefined) {
    return [["path", undefined]] as const;
  }
  const canonical = canonicalPathOrThrow(path, "filesystem path");
  return [["path", canonical === filesystemRoot ? undefined : canonical]] as const;
};

/** The same, for the one file a viewer addresses; the root names a directory, never a file. */
const filePathQuery = (path: string) => {
  const canonical = canonicalPathOrThrow(path, "file path");
  if (canonical === filesystemRoot) {
    throw new TypeError("Invalid file path");
  }
  return [["path", canonical]] as const;
};

const readDirectoryQuery = (searchParams: URLSearchParams) => {
  const path = readOptionalQuery(searchParams, "path", namesFilesystemPath);
  const canonical = path === undefined ? undefined : canonicalFilesystemPath(path);
  return canonical === null || canonical === filesystemRoot ? undefined : canonical;
};

const subscriptionQuery = (subscriptionId: string | undefined) =>
  [
    [
      "subscription",
      subscriptionId
        ? assertRouteValue(subscriptionId, isProductId, "subscription product ID")
        : undefined,
    ],
  ] as const;

export const projectLinks = {
  index: (state: SearchState = {}) => buildHref("/projects", searchQuery(state.search)),
  create: ({ subscriptionId }: { subscriptionId?: string } = {}) =>
    buildHref("/projects/new", subscriptionQuery(subscriptionId)),
  deletion: (taskId: string, { subscriptionId }: { subscriptionId?: string } = {}) =>
    buildHref(
      `/projects/deletions/${assertRouteValue(taskId, isTaskId, "deletion task ID")}`,
      subscriptionQuery(subscriptionId),
    ),
  entry: (projectId: string) => `/projects/${assertProjectId(projectId)}`,
  files: (projectId: string, { path }: { path?: string } = {}) =>
    buildHref(`/projects/${assertProjectId(projectId)}/files`, directoryQuery(path)),
  fileView: (projectId: string, { path, viewer }: { path: string; viewer?: FileViewer }) =>
    buildHref(`/projects/${assertProjectId(projectId)}/files/view`, [
      ...filePathQuery(path),
      ["viewer", viewer],
    ]),
  run: (projectId: string, state: RunState = {}) =>
    buildHref(`/projects/${assertProjectId(projectId)}/run`, filterQuery(state, runFilterTypes)),
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
      filterQuery(state, runFilterTypes),
    ),
  results: (projectId: string, state: ResultsState = {}) =>
    buildHref(
      `/projects/${assertProjectId(projectId)}/results`,
      filterQuery(state, resultFilterTypes),
    ),
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
      filterQuery(state, resultFilterTypes),
    ),
  manage: (projectId: string) => `/projects/${assertProjectId(projectId)}/manage`,
};

/**
 * Whether a section's list state shows one type. A route carries only the types it narrows to, so
 * a state that narrows to none narrows to nothing at all: a list, its filter control, and the link
 * that rebuilds its route therefore all read an emptied filter as a cleared one.
 */
export const showsType = <TValue extends string>(
  types: readonly TValue[] | undefined,
  value: TValue,
) => types === undefined || types.length === 0 || types.includes(value);

/**
 * The project a Projects-family local not-found was addressed beneath. A child the section could
 * not address still names a valid parent, and that parent is re-validated here rather than
 * trusted, so a section rendering beneath it is rendering beneath a project identity the family
 * itself accepts.
 */
export const localNotFoundProjectId = (parent: RouteNotFoundParent): ProjectId | undefined =>
  parent.family === "projects" && parent.resourceId !== undefined && isProjectId(parent.resourceId)
    ? parent.resourceId
    : undefined;

/**
 * The catalogue state one Run route carries. Only Run owns these values, so nothing a definition
 * link preserves can reach another section or another project.
 */
export const runCatalogueState = (
  route: Extract<ProjectRoute, { kind: "run-definition" | "run" }>,
): RunState => filterState(route.search, route.types);

/**
 * The Results list state one Results route carries. Only Results owns these values, so nothing a
 * child link preserves can reach another section or another project.
 */
export const resultsListState = (
  route: Extract<ProjectRoute, { kind: "result" | "results" }>,
): ResultsState => filterState(route.search, route.types);

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
    const path = readDirectoryQuery(searchParams);
    const route: ProjectRoute = { kind: "files", projectId, ...(path ? { path } : {}) };
    return validRoute(location, route, projectLinks.files(projectId, route));
  }

  if (segments.length === 4 && segments[2] === "files" && segments[3] === "view") {
    const required = readRequiredQuery(searchParams, "path", namesFilesystemPath);
    const path = required === null ? null : canonicalFilesystemPath(required);
    if (path === null || path === filesystemRoot) {
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

  if (segments.length > 3 && segments[2] === "run") {
    // A URL beneath Run that is not shaped like a definition route at all is still addressed
    // beneath a project this family accepts, so Run answers for it locally. Losing the project
    // frame here would make a mistyped path indistinguishable from a missing project.
    return localNotFoundRoute("projects", "run", projectId);
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
