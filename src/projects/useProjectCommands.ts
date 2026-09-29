import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddAdministratorToProject,
  useAddEditorToProject,
  useAddObserverToProject,
  usePatchProject,
  useRemoveAdministratorFromProject,
  useRemoveEditorFromProject,
  useRemoveObserverFromProject,
} from "@/api/data-manager/project";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import {
  type ProjectCommandOutcome,
  type ProjectRole,
  resolveProjectMemberChange,
  resolveProjectPrivacyChange,
} from "./projectMutations";

/**
 * What every generated membership mutation offers this owner. Each role's add and remove hooks take
 * the same arguments, so the map holds them by what they do rather than by which one it was typed
 * from.
 */
type ProjectMemberMutation = {
  mutateAsync: (variables: { projectId: string; userId: string }) => Promise<unknown>;
};

/**
 * The generated key factories are the sole cache identity for project data, so every command
 * refreshes the addressed project and the caller's project index rather than keeping an aggregate
 * of its own.
 */
const refreshProject = async (queryClient: QueryClient, projectId: string) => {
  await Promise.all(
    [getGetProjectQueryKey(projectId), getGetProjectsQueryKey()].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
};

/**
 * The only owner of project mutations and of the invalidation that follows them. Every command
 * names the project it changes as a required argument, shapes its own input so nothing unusable
 * reaches the Data Manager, and answers with what it did rather than with words. A rejection is
 * rethrown so its caller can present the server's verdict in place.
 */
export const useProjectCommands = () => {
  const queryClient = useQueryClient();
  const patchProject = usePatchProject();
  const addAdministrator = useAddAdministratorToProject();
  const removeAdministrator = useRemoveAdministratorFromProject();
  const addEditor = useAddEditorToProject();
  const removeEditor = useRemoveEditorFromProject();
  const addObserver = useAddObserverToProject();
  const removeObserver = useRemoveObserverFromProject();

  const memberMutations: Record<ProjectRole, Record<"add" | "remove", ProjectMemberMutation>> = {
    administrator: { add: addAdministrator, remove: removeAdministrator },
    editor: { add: addEditor, remove: removeEditor },
    observer: { add: addObserver, remove: removeObserver },
  };

  return {
    /**
     * Applies the one membership change a list edit expresses. The lists as displayed and as
     * requested are the whole input: the command decides which user changed, so no caller has to
     * work it out, and an edit that expresses no usable change is reported rather than sent.
     */
    changeProjectMembers: async (
      projectId: string,
      role: ProjectRole,
      current: readonly string[],
      next: readonly string[],
    ): Promise<ProjectCommandOutcome> => {
      const change = resolveProjectMemberChange(role, current, next);
      if (change.kind === "none") {
        return { kind: "unchanged", reason: change.reason };
      }
      await memberMutations[role][change.kind].mutateAsync({ projectId, userId: change.username });
      await refreshProject(queryClient, projectId);
      return {
        change: change.kind === "add" ? "added" : "removed",
        kind: "membership",
        role,
        username: change.username,
      };
    },

    /** Sets the project's privacy. Privacy the project already has is reported, never sent. */
    setProjectPrivacy: async (
      projectId: string,
      current: boolean,
      next: boolean,
    ): Promise<ProjectCommandOutcome> => {
      const change = resolveProjectPrivacyChange(current, next);
      if (change.kind === "none") {
        return { kind: "unchanged", reason: change.reason };
      }
      await patchProject.mutateAsync({ projectId, data: { private: change.isPrivate } });
      await refreshProject(queryClient, projectId);
      return { isPrivate: change.isPrivate, kind: "privacy" };
    },
  };
};
