import { atom } from "jotai";

import { type ProjectWorkspace } from "./useRouteProject";

export type RouteProjectResolution =
  | { projectId: string; status: "failed"; workspace?: undefined }
  | { projectId: string; status: "resolved"; workspace: ProjectWorkspace };

/**
 * What became of the project the URL names, published for the chrome above it.
 *
 * The project identity strip is mounted once, above every boundary a navigation discards, so it
 * sits above the boundary that reads the project and cannot receive the answer as context. Screens
 * beneath that boundary keep reading the workspace from context, where it is available on the
 * render that resolves it; the strip reads this instead, which is one commit behind and is why it
 * has a loading treatment of its own. Recording the failure as well as the success is what lets the
 * strip say a project is arriving rather than saying it is unavailable.
 */
export const routeProjectResolutionAtom = atom<RouteProjectResolution | null>(null);

/** Clears a resolution only while it is still the one this project published. */
export const clearRouteProjectResolution =
  (projectId: string) =>
  (current: RouteProjectResolution | null): RouteProjectResolution | null =>
    current?.projectId === projectId ? null : current;
