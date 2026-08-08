import { getGetDatasetsQueryKey, useCreateDatasetFromFile } from "@/api/data-manager/dataset";
import {
  getGetFilesQueryKey,
  useAddFileToProject,
  useCreatePath,
  useDeleteFile,
  useDeletePath,
  useDeleteUnmanagedFile,
  useMoveFileInProject,
  useMovePath,
} from "@/api/data-manager/file-and-path";
import { getGetProjectQueryKey } from "@/api/data-manager/project";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { childFilesystemPath } from "./fileFacts";
import {
  type FileCommandOutcome,
  resolveDatasetCreation,
  resolveDirectoryCreation,
  resolveFileMove,
} from "./fileMutations";

/**
 * The generated cache identities one file command touches: the directories whose listings it may
 * have changed, and the project whose storage it accounted against. The generated key factories are
 * the sole cache identity, and every listing key is built from the addressed project's own request,
 * so a command refreshes that project's directories and never an unprojected or foreign listing.
 */
const refreshDirectories = async (
  queryClient: QueryClient,
  projectId: string,
  paths: readonly string[],
) => {
  const queryKeys = [
    ...new Set(paths).values().map((path) => getGetFilesQueryKey({ project_id: projectId, path })),
    getGetProjectQueryKey(projectId),
  ];
  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};

/**
 * The only owner of Files mutations and of the invalidation that follows them. Every command names
 * the project it changes and the directory it acts in as required arguments, shapes its own input
 * so nothing unusable reaches the Data Manager, and answers with what it did rather than with
 * words. A rejection is rethrown so its caller can present the server's verdict in place, and the
 * directories it addressed are refreshed either way, because a rejected command still leaves what
 * is displayed in doubt.
 */
export const useFileCommands = (projectId: string) => {
  const queryClient = useQueryClient();
  const createPath = useCreatePath();
  const deletePath = useDeletePath();
  const movePath = useMovePath();
  const addFile = useAddFileToProject();
  const deleteUnmanagedFile = useDeleteUnmanagedFile();
  const moveFile = useMoveFileInProject();
  const detachFile = useDeleteFile();
  const createDataset = useCreateDatasetFromFile();

  const command = async (
    mutate: () => Promise<unknown>,
    paths: readonly string[],
  ): Promise<void> => {
    try {
      await mutate();
    } finally {
      await refreshDirectories(queryClient, projectId, paths);
    }
  };

  return {
    /** Creates one directory inside the displayed one. A name already taken is reported, not sent. */
    createDirectory: async (
      path: string,
      name: string,
      existing: readonly string[],
    ): Promise<FileCommandOutcome> => {
      const creation = resolveDirectoryCreation(path, name, existing);
      if (creation.kind === "none") {
        return { kind: "unchanged", reason: creation.reason };
      }
      await command(
        () => createPath.mutateAsync({ params: { path: creation.path, project_id: projectId } }),
        [path],
      );
      return { kind: "created-directory", name: creation.name };
    },

    /**
     * Creates a dataset from one file of the displayed directory. The billing unit is the project's
     * own containing unit, so a dataset made from a project file is charged where the project is.
     * The file becomes a managed one, so the directory it is in is refreshed alongside the dataset
     * collection rather than left showing how the project held it before.
     */
    createDatasetFromFile: async (input: {
      fileName: string;
      mimeType: string | undefined;
      path: string;
      unitId: string;
    }): Promise<FileCommandOutcome> => {
      const creation = resolveDatasetCreation(input);
      if (creation.kind === "none") {
        return { kind: "unchanged", reason: creation.reason };
      }
      try {
        await command(
          () =>
            createDataset.mutateAsync({
              data: {
                dataset_type: creation.datasetType,
                file_name: creation.fileName,
                path: creation.path,
                project_id: projectId,
                unit_id: input.unitId,
              },
            }),
          [creation.path],
        );
      } finally {
        await queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() });
      }
      return { kind: "created-dataset", name: creation.fileName };
    },

    /** Deletes one directory of the displayed one, and everything beneath it. */
    deleteDirectory: async (path: string, name: string): Promise<FileCommandOutcome> => {
      await command(
        () =>
          deletePath.mutateAsync({
            params: { path: childFilesystemPath(path, name), project_id: projectId },
          }),
        [path],
      );
      return { kind: "deleted", name, type: "directory" };
    },

    /** Deletes one unmanaged file of the displayed directory. */
    deleteUnmanagedFile: async (path: string, name: string): Promise<FileCommandOutcome> => {
      await command(
        () =>
          deleteUnmanagedFile.mutateAsync({ params: { file: name, path, project_id: projectId } }),
        [path],
      );
      return { kind: "deleted", name, type: "file" };
    },

    /**
     * Detaches one managed file from the project. The dataset the file came from is left alone, so
     * this is not a deletion of anything but the project's link to it.
     */
    detachFile: async (path: string, fileId: string, name: string): Promise<FileCommandOutcome> => {
      await command(() => detachFile.mutateAsync({ fileId }), [path]);
      return { kind: "detached", name };
    },

    /**
     * Renames or moves one file or directory. Both the directory it left and the directory it
     * arrived in are refreshed, so neither listing keeps showing an item that is no longer there.
     */
    moveObject: async (
      type: "directory" | "file",
      source: string,
      destination: string,
    ): Promise<FileCommandOutcome> => {
      const move = resolveFileMove(type, source, destination);
      if (move.kind === "none") {
        return { kind: "unchanged", reason: move.reason };
      }
      if (move.kind === "move-directory") {
        await command(
          () =>
            movePath.mutateAsync({
              params: { dst_path: move.destination, project_id: projectId, src_path: move.source },
            }),
          [move.source, move.destination],
        );
        return { kind: "moved", type };
      }
      await command(
        () =>
          moveFile.mutateAsync({
            params: {
              dst_file: move.destination,
              dst_path: move.destinationPath,
              file: move.name,
              project_id: projectId,
              src_path: move.path,
            },
          }),
        [move.path, move.destinationPath],
      );
      return { kind: "moved", type };
    },

    /** Uploads one unmanaged file into the displayed directory. */
    uploadFile: async (path: string, file: File): Promise<FileCommandOutcome> => {
      await command(
        () => addFile.mutateAsync({ data: { as_filename: file.name, file, path }, projectId }),
        [path],
      );
      return { kind: "uploaded", name: file.name };
    },
  };
};
