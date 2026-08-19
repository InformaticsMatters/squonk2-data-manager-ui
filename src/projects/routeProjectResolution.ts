import { useEffect } from "react";

import { atom, useAtomValue, useSetAtom } from "jotai";

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
 *
 * This is not selected scope. It holds only what the URL project resolved to, is keyed by that
 * project, and is cleared when the boundary that resolved it goes away; nothing reads it to decide
 * which project to display.
 */
const routeProjectResolutionAtom = atom<RouteProjectResolution | null>(null);

/** Publishes one project's resolution for as long as the caller is showing it. */
export const usePublishRouteProjectResolution = (resolution: RouteProjectResolution | null) => {
  const setResolution = useSetAtom(routeProjectResolutionAtom);

  useEffect(() => {
    if (!resolution) {
      return;
    }
    const { projectId } = resolution;
    setResolution(resolution);
    // Only ever retracts its own answer, so a project arriving as this one leaves keeps its.
    return () => setResolution((current) => (current?.projectId === projectId ? null : current));
  }, [resolution, setResolution]);
};

/** What the URL project resolved to, or undefined while nothing has been published for it. */
export const useRouteProjectResolution = (projectId: string) => {
  const published = useAtomValue(routeProjectResolutionAtom);
  return published?.projectId === projectId ? published : undefined;
};
