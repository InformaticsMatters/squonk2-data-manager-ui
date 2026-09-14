import { type FamilyRoute } from "../application/familyRoute";
import { type FamilyRouteContextValue } from "../application/FamilyRouteResolution";
import { type ProjectId } from "../routing/identifiers";
import { localNotFoundProjectId } from "./routes";

/**
 * What a Projects-family section has been asked to render.
 */
export type ProjectSectionRoute<TRoute> =
  /** A child this section could not address, beneath a project it still keeps. */
  | { kind: "local-not-found"; projectId: ProjectId }
  | { kind: "not-found" }
  | { kind: "route"; route: TRoute };

/**
 * The one rule every project section follows about the route it was given: a child the section
 * could not address keeps the project it was addressed beneath, so the section stays on screen and
 * answers locally, and only a route that is not this section's at all disappears entirely. Sharing
 * it means no section can quietly decide to guess a correction instead.
 */
export const resolveProjectSectionRoute = <TRoute extends FamilyRoute>(
  familyRoute: FamilyRouteContextValue,
  isSectionRoute: (route: FamilyRoute) => route is TRoute,
): ProjectSectionRoute<TRoute> => {
  if (familyRoute.localNotFound) {
    const projectId = localNotFoundProjectId(familyRoute.parent);
    return projectId === undefined ? { kind: "not-found" } : { kind: "local-not-found", projectId };
  }

  return isSectionRoute(familyRoute.route)
    ? { kind: "route", route: familyRoute.route }
    : { kind: "not-found" };
};
