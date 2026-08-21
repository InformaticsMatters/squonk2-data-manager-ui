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
  isUnitId,
  isWorkflowId,
  type PositiveIntegerString,
  type ProductId,
  type ProjectId,
  type RunningWorkflowId,
  type TaskId,
  type UnitId,
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
import { withBasePath } from "../utils/app/basePath";
import {
  canonicalFilesystemPath,
  type FilesystemFile,
  filesystemFile,
  filesystemRoot,
} from "./fileFacts";
import { defaultFileViewer, type FileViewer, isFileViewer } from "./fileViewers";

const runFilterTypes = ["workflow", "application", "job"] as const;
export const resultFilterTypes = ["workflow", "task", "instance"] as const;

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

export type RunDefinitionType = keyof typeof definitionIdValidators;
export type RunFilterType = (typeof runFilterTypes)[number];
export type ResultCollection = keyof typeof resultIdValidators;
export type ResultFilterType = (typeof resultFilterTypes)[number];

type SearchState = { search?: string };
export type RunState = SearchState & { types?: readonly RunFilterType[] };

/**
 * How the Projects index is narrowed. The unit filter joins the search term in the URL because the
 * URL is the single description of what the index displays: a narrowed list can then be shared and
 * bookmarked exactly as a searched one already is.
 */
export type ProjectIndexState = SearchState & { unitId?: UnitId };

/** The same narrowing as a caller names it, before the route has checked the unit identifier. */
export type ProjectIndexLinkState = SearchState & { unitId?: string };

type DefinitionIdByType = {
  applications: ApplicationId;
  jobs: PositiveIntegerString;
  workflows: WorkflowId;
};

/**
 * The definition whose executions a Results list is narrowed to. The type and the identifier are a
 * pair — an identifier means nothing without the type whose validator accepted it, and a type
 * means nothing without an identifier — so they are modelled as one value rather than as two
 * independent optional ones. The version is optional and meaningless without the pair: absent
 * means every version of the definition, present narrows to that one.
 */
export type ResultsDefinitionFilter = {
  [TType in RunDefinitionType]: {
    definitionType: TType;
    definitionId: DefinitionIdByType[TType];
    version?: string;
  };
}[RunDefinitionType];

/**
 * The same pair as a caller names it, before the route has checked the identifier against it. What
 * a definition filter *is* rather than what a route proved about it, so a facts module that only
 * reads the pair need not carry the route's own proof of it.
 */
export type UncheckedDefinitionFilter = {
  definitionType: RunDefinitionType;
  definitionId: string;
  version?: string;
};

/**
 * How a Results list is narrowed. A definition filter and a type filter are mutually exclusive: a
 * route carrying a definition filter carries no types at all, so the contradiction is
 * unrepresentable rather than merely unreachable.
 */
type ResultsNarrowing<TDefinition> =
  | { definition: TDefinition; types?: never }
  | { definition?: never; types?: readonly ResultFilterType[] };

export type ResultsState = ResultsNarrowing<ResultsDefinitionFilter> & SearchState;

/**
 * The Results list state a link is built from. A route's own state is always one of these, and a
 * caller who has not been through the parser may name a definition the builder then checks.
 */
export type ResultsLinkState = ResultsNarrowing<UncheckedDefinitionFilter> & SearchState;

type ResultIdByCollection = { instances: InstanceId; tasks: TaskId; workflows: RunningWorkflowId };

type RunDefinitionRoute = {
  [TType in RunDefinitionType]: RunState & {
    kind: "run-definition";
    projectId: ProjectId;
    definitionType: TType;
    definitionId: DefinitionIdByType[TType];
  };
}[RunDefinitionType];

/**
 * Whether the addressed instance's rerun is open. Only an instance names a job that can be run
 * again, so only its own route carries this: the collection decides whether the value exists at
 * all, and a rerun therefore cannot be addressed for a task or a running workflow.
 */
type ResultRerunState = { rerun?: true };

type ResultRoute = {
  [TCollection in ResultCollection]: ResultsState &
    (TCollection extends "instances" ? ResultRerunState : unknown) & {
      kind: "result";
      projectId: ProjectId;
      collection: TCollection;
      resultId: ResultIdByCollection[TCollection];
    };
}[ResultCollection];

export type ProjectRoute =
  | ResultRoute
  | RunDefinitionRoute
  | { kind: "create"; subscriptionId?: ProductId; unitId?: UnitId }
  | { kind: "deletion"; taskId: TaskId; subscriptionId?: ProductId }
  | { kind: "file-view"; projectId: ProjectId; path: string; viewer?: FileViewer }
  | { kind: "files"; projectId: ProjectId; path?: string }
  | { kind: "manage"; projectId: ProjectId }
  | (ProjectIndexState & { kind: "index" })
  | (ResultsState & { kind: "results"; projectId: ProjectId })
  | (RunState & { kind: "run"; projectId: ProjectId });

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

/**
 * The Results list state a route carries, built the same way whether it was read from a URL or
 * taken from an already-parsed route. The two narrowings are mutually exclusive, so a definition
 * filter is written on its own and any type filter beside it is dropped rather than carried into a
 * route that cannot express both.
 */
const resultsFilterState = (
  search: string | undefined,
  definition: ResultsDefinitionFilter | undefined,
  types: readonly ResultFilterType[] | undefined,
): ResultsState =>
  definition ? { ...(search ? { search } : {}), definition } : filterState(search, types);

const parseResultsState = (searchParams: URLSearchParams): ResultsState =>
  resultsFilterState(
    optionalSearch(searchParams),
    parseDefinitionFilter(searchParams),
    readEnumQuery(searchParams, "type", resultFilterTypes),
  );

const canonicalEnumValues = <TValue extends string>(
  values: readonly TValue[] | undefined,
  order: readonly TValue[],
) => (values ? order.filter((value) => values.includes(value)) : undefined);

const parseSubscription = (searchParams: URLSearchParams) =>
  readOptionalQuery(searchParams, "subscription", isProductId);

/**
 * The unit a `unit` value names, wherever the family carries one: the container a caller arrived at
 * creation already meaning to use, and the unit the index is narrowed to. Both carry an intent
 * across a navigation, and both treat a unit that parses but is no longer available as no selection
 * on the screen itself, silently — an aged-out link is an ordinary arrival, not a broken workflow.
 */
const parseUnit = (searchParams: URLSearchParams) =>
  readOptionalQuery(searchParams, "unit", isUnitId);

const isDefinitionType = (value: string): value is RunDefinitionType =>
  Object.hasOwn(definitionIdValidators, value);

const parseDefinitionId = <TType extends RunDefinitionType>(
  type: TType,
  value: string,
): DefinitionIdByType[TType] | null =>
  definitionIdValidators[type](value) ? (value as DefinitionIdByType[TType]) : null;

/**
 * The one way a definition identifier reaches a link, so an identifier of the wrong shape for the
 * type it is named beside is refused rather than written into a URL.
 */
const assertDefinitionId = (definitionType: RunDefinitionType, definitionId: string) =>
  assertRouteValue(
    definitionId,
    (value) => parseDefinitionId(definitionType, value) !== null,
    `${definitionType} definition ID`,
  );

/**
 * A definition version as a URL carries it. Versions are free-form strings the catalogue decides,
 * so a version is bounded by the same rule as every other free-form value this family carries:
 * never empty, and never unbounded.
 */
export const isDefinitionVersion = isSearch;

/**
 * The definition a Results URL narrows to, or nothing at all. Half a pair names no definition, and
 * neither does an identifier of the wrong shape for its type, so either reverts to the omitted
 * default — the whole list — rather than to a guess. The version is read only beside a complete
 * pair, and an unusable one reverts to every version rather than costing the pair it sits beside.
 */
const parseDefinitionFilter = (
  searchParams: URLSearchParams,
): ResultsDefinitionFilter | undefined => {
  const definitionType = readOptionalQuery(searchParams, "definitionType", isDefinitionType);
  if (definitionType === undefined) {
    return undefined;
  }
  const named = readOptionalQuery(
    searchParams,
    "definitionId",
    (value) => parseDefinitionId(definitionType, value) !== null,
  );
  const definitionId = named === undefined ? null : parseDefinitionId(definitionType, named);
  if (definitionId === null) {
    return undefined;
  }
  const version = readOptionalQuery(searchParams, "version", isDefinitionVersion);
  // The identifier is the one its own type's validator accepted; only the correlation between the
  // two — which no signature can express — is asserted here, as the definition route already does.
  return {
    definitionType,
    definitionId,
    ...(version ? { version } : {}),
  } as ResultsDefinitionFilter;
};

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

/**
 * The definition filter as a link writes it. The pair is checked here, so a link naming a
 * definition an identifier cannot belong to is refused rather than written and then silently
 * dropped by the parser that reads it back.
 */
const definitionFilterQuery = ({
  definitionId,
  definitionType,
  version,
}: UncheckedDefinitionFilter) =>
  [
    ["definitionType", assertRouteValue(definitionType, isDefinitionType, "definition type")],
    ["definitionId", assertDefinitionId(definitionType, definitionId)],
    [
      "version",
      version === undefined
        ? undefined
        : assertRouteValue(version, isDefinitionVersion, "definition version"),
    ],
  ] as const;

/**
 * The query state a Results list owns. The two narrowings are mutually exclusive, so exactly one
 * of them ever reaches a link and no URL this client writes carries the contradiction.
 */
const resultsQuery = (state: ResultsLinkState) =>
  state.definition
    ? ([...searchQuery(state.search), ...definitionFilterQuery(state.definition)] as const)
    : filterQuery(state, resultFilterTypes);

/**
 * The one spelling an open rerun has in a URL. A single canonical value is what makes every other
 * spelling of the flag state the route does not own, so it is dropped rather than carried.
 */
const rerunQueryValue = "1";

const isRerunFlag = (value: string) => value === rerunQueryValue;

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
const filePathQuery = (path: string) => [["path", assertFilePath(path).path]] as const;

/**
 * The one way a viewer reaches a link. The viewer every file offers is the section's own default
 * rather than a value the URL carries, so a link to it and a link that spells it out are the same
 * link, and a viewer this section has no rule for is never written into a URL.
 */
const viewerQuery = (viewer: FileViewer | undefined) =>
  [
    [
      "viewer",
      viewer === undefined || viewer === defaultFileViewer
        ? undefined
        : assertRouteValue(viewer, isFileViewer, "file viewer"),
    ],
  ] as const;

/**
 * The one file a path addresses, or a rejection naming what it was supposed to be. Every transport
 * and every viewer link splits a path here, so the directory and the file name a Data Manager
 * request carries are the ones the route itself names.
 */
const assertFilePath = (path: string) => {
  const file = filesystemFile(path);
  if (file === null) {
    throw new TypeError("Invalid file path");
  }
  return file;
};

const readDirectoryQuery = (searchParams: URLSearchParams) => {
  const path = readOptionalQuery(searchParams, "path", namesFilesystemPath);
  const canonical = path === undefined ? undefined : canonicalFilesystemPath(path);
  return canonical === null || canonical === filesystemRoot ? undefined : canonical;
};

const unitQuery = (unitId: string | undefined) =>
  [["unit", unitId ? assertRouteValue(unitId, isUnitId, "unit ID") : undefined]] as const;

const subscriptionQuery = (subscriptionId: string | undefined) =>
  [
    [
      "subscription",
      subscriptionId
        ? assertRouteValue(subscriptionId, isProductId, "subscription product ID")
        : undefined,
    ],
  ] as const;

/**
 * Where one result lives. Every link to a result and to any view of it is built from here, so the
 * collection that placed it and the identity that collection accepts are checked once.
 */
const resultPath = (projectId: string, collection: ResultCollection, resultId: string) =>
  `/projects/${assertProjectId(projectId)}/results/${collection}/${assertRouteValue(
    resultId,
    (value) => parseResultId(collection, value) !== null,
    `${collection} result ID`,
  )}`;

export const projectLinks = {
  index: (state: ProjectIndexLinkState = {}) =>
    buildHref("/projects", [...searchQuery(state.search), ...unitQuery(state.unitId)]),
  create: ({ subscriptionId, unitId }: { subscriptionId?: string; unitId?: string } = {}) =>
    buildHref("/projects/new", [...subscriptionQuery(subscriptionId), ...unitQuery(unitId)]),
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
      ...viewerQuery(viewer),
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
      `/projects/${assertProjectId(projectId)}/run/${definitionType}/${assertDefinitionId(
        definitionType,
        definitionId,
      )}`,
      filterQuery(state, runFilterTypes),
    ),
  results: (projectId: string, state: ResultsLinkState = {}) =>
    buildHref(`/projects/${assertProjectId(projectId)}/results`, resultsQuery(state)),
  result: (
    projectId: string,
    collection: ResultCollection,
    resultId: string,
    state: ResultsLinkState = {},
  ) => buildHref(resultPath(projectId, collection, resultId), resultsQuery(state)),
  /**
   * The addressed instance with its rerun open. It is built from the instance's own collection, so
   * a rerun is only ever addressed for an instance, and it carries the same Results list state the
   * instance's own route does — a rerun is a view of one instance rather than a section of its own.
   */
  resultRerun: (projectId: string, instanceId: string, state: ResultsLinkState = {}) =>
    buildHref(resultPath(projectId, "instances", instanceId), [
      ...resultsQuery(state),
      ["rerun", rerunQueryValue],
    ]),
  manage: (projectId: string) => `/projects/${assertProjectId(projectId)}/manage`,
};

/**
 * What the caller calls each section a project has. The label is here beside the links rather than
 * in the chrome that renders them, so the strip's navigation and the project selector's promise
 * about where a chosen project opens are named from one place.
 */
const projectSectionLabels = {
  files: "Files",
  manage: "Manage",
  results: "Results",
  run: "Run",
} as const;

export type ProjectSectionKey = keyof typeof projectSectionLabels;

/** The sections a project has, in the order the identity strip offers them. */
export const projectSections = (["files", "run", "results", "manage"] as const).map((key) => ({
  key,
  label: projectSectionLabels[key],
}));

/** Where one section of one project starts, with none of the view state a caller may add to it. */
export const projectSectionHref = (section: ProjectSectionKey, projectId: string) =>
  projectLinks[section](projectId);

export const projectSectionLabel = (section: ProjectSectionKey) => projectSectionLabels[section];

/**
 * The section a path is standing in, read from the path rather than remembered.
 *
 * A deeper child — one result, one file view — answers as its own section, because a child of the
 * project being switched to may not exist. That is what makes "open the section I am already in" a
 * promise the selector can keep: it resolves to a section every project has, or to Files.
 */
export const routeProjectSection = (path: string, projectId: string): ProjectSectionKey =>
  projectSections.find(({ key }) => path.startsWith(projectSectionHref(key, projectId)))?.key ??
  "files";

/**
 * The project file a server entry was asked for, or `null` for a request that names no file this
 * client can address. Every server entry reads its arguments here, so a page and an API route agree
 * on what a project file request even is before either of them sends one.
 */
export const readProjectFileAddress = (
  projectId: unknown,
  path: unknown,
): { file: FilesystemFile; projectId: ProjectId } | null => {
  if (typeof projectId !== "string" || !isProjectId(projectId) || typeof path !== "string") {
    return null;
  }
  const file = filesystemFile(path);
  return file === null ? null : { file, projectId };
};

/**
 * Data Manager resource path of one project file. Server-side transports prefix it with the Data
 * Manager API server; browser transports prefix it with a proxy and the base path. The project and
 * the file path are the route's own, so nothing addresses a file of another project or a file the
 * route could not name.
 */
export const projectFileResourcePath = (projectId: string, path: string) => {
  const file = assertFilePath(path);
  return buildHref(`/project/${assertProjectId(projectId)}/file`, [
    ["path", file.directory],
    ["file", file.name],
  ]);
};

/**
 * Transport hrefs for one project file. These leave the Pages Router for the Data Manager proxies,
 * so they carry the deployment base path and address the exact file rather than route state.
 */
export const projectFileTransportLinks = {
  browserView: (projectId: string, path: string) =>
    withBasePath(`/api/viewer-proxy${projectFileResourcePath(projectId, path)}`),
  download: (projectId: string, path: string) =>
    withBasePath(`/api/dm-api${projectFileResourcePath(projectId, path)}`),
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
 * The types a route carries, given what a section's type filter has selected. The counterpart of
 * `showsType` on the writing side: a filter that has selected every type it offers narrows exactly
 * as much as one that has selected none — nothing — and a route can express neither, so both are
 * written as the one absent value rather than as a selection the URL cannot carry.
 */
export const narrowedTypes = <TValue extends string>(
  selected: readonly TValue[],
  offered: readonly TValue[],
): readonly TValue[] | undefined =>
  selected.length === 0 || selected.length === offered.length ? undefined : selected;

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
): ResultsState => resultsFilterState(route.search, route.definition, route.types);

/**
 * The same Results list state with its definition filter cleared. All three of the filter's keys go
 * together, because none of them narrows anything without the others, and nothing is left in their
 * place: the two narrowings are mutually exclusive in the route, so there is no stranded type
 * filter to clean up and the caller is never handed a narrowing they did not choose. The search
 * they typed is theirs and stays.
 */
export const resultsWithoutDefinition = (state: ResultsLinkState): ResultsState =>
  resultsFilterState(state.search, undefined, undefined);

export const parseProjectRoute = (href: string): RouteParseResult<ProjectRoute> => {
  const location = parseRouteLocation(href);
  if (location?.segments[0] !== "projects") {
    return notFoundRoute;
  }

  const { searchParams, segments } = location;
  if (segments.length === 1) {
    const search = optionalSearch(searchParams);
    const unitId = parseUnit(searchParams);
    const route: ProjectRoute = {
      kind: "index",
      ...(search ? { search } : {}),
      ...(unitId ? { unitId } : {}),
    };
    return validRoute(location, route, projectLinks.index(route));
  }

  if (segments.length === 2 && segments[1] === "new") {
    const subscriptionId = parseSubscription(searchParams);
    const unitId = parseUnit(searchParams);
    const route: Extract<ProjectRoute, { kind: "create" }> = {
      kind: "create",
      ...(subscriptionId ? { subscriptionId } : {}),
      ...(unitId ? { unitId } : {}),
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
    const named = readOptionalQuery(searchParams, "viewer", isFileViewer);
    // The default viewer is the section's own, so a URL that spells it out carries a value it does
    // not own and is replaced by the one canonical link for the same view.
    const viewer = named === defaultFileViewer ? undefined : named;
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
    // Only an instance has a job to run again, so only its collection can carry an open rerun.
    // Anywhere else the flag names nothing this route owns, and is dropped with the rest of the
    // state a Results route does not own.
    const rerun =
      collection === "instances" &&
      readOptionalQuery(searchParams, "rerun", isRerunFlag) !== undefined;
    const route = {
      kind: "result",
      projectId,
      collection,
      resultId,
      ...state,
      ...(rerun ? { rerun: true } : {}),
    } as ResultRoute;
    return validRoute(
      location,
      route,
      rerun
        ? projectLinks.resultRerun(projectId, resultId, state)
        : projectLinks.result(projectId, collection, resultId, state),
    );
  }

  if (segments.length === 3 && segments[2] === "manage") {
    const route: ProjectRoute = { kind: "manage", projectId };
    return validRoute(location, route, projectLinks.manage(projectId));
  }

  return notFoundRoute;
};
