import {
  getGetFilesQueryKey,
  useMoveFileInProject,
  useMovePath,
} from "@squonk/data-manager-client/file-and-path";
import { getGetProjectQueryKey } from "@squonk/data-manager-client/project";

import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../useEnqueueStackError";

export type ProjectObject = "directory" | "file";

/**
 * Valid pattern for a path that will be accepted by the API.
 * A leading `/` is prepended to the path before being sent
 */
export const PATH_PATTERN = /^[A-Za-z0-9-_.]+(\/[A-Za-z0-9-_.]+)*$/u;

const getPathStem = (path: string) => "/" + path.split("/").slice(0, -1).join("/");

// type OnSettledType<T extends {}> = NonNullable<NonNullable<T>["mutation"]>["onSettled"];

/**
 * This hook is used to move project files or directories from one path to another.
 *
 * It will handle the appropriate mutation and query cache invalidations.
 *
 * When a file is renamed and/or moved, we must invalidate the query cache for
 * - getGetProjectQueryKey for the current project ID
 * - getGetFilesQueryKey for the source path
 * - getGetFilesQueryKey for the destination path
 *
 * When a directory is moved, we must invalidate the query cache for
 * - getGetProjectQueryKey for the current project ID
 * - getGetFilesQueryKey for the source path
 * - getGetFilesQueryKey for the destination path
 *
 * @param projectId - ID of the project the file or directory belongs to
 * @param srcPath - Path of the file or directory to be moved
 * @param type - Type of the object to be moved
 * @param onSettled - Callback function to be called when the mutation is settled.
 * Useful to reset a form or close a modal.
 */
export const useMoveProjectObject = (
  projectId: string,
  srcPath: string,
  type: ProjectObject,
  onSettled?: () => void,
) => {
  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const queryClient = useQueryClient();

  // Invalidate the queries for the project and the source and destination paths
  // Used in each of the mutation calls
  const invalidateQueries = (srcPath: string, dstPath?: string) => {
    const promises = [
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
      queryClient.invalidateQueries({
        queryKey: getGetFilesQueryKey({ project_id: projectId, path: srcPath }),
      }),
    ];
    if (dstPath) {
      promises.push(
        queryClient.invalidateQueries({
          queryKey: getGetFilesQueryKey({ project_id: projectId, path: getPathStem(dstPath) }),
        }),
      );
    }
    return Promise.allSettled(promises);
  };

  // Mutation Hooks
  const {
    mutate: moveFile,
    isPending: filePending,
    error: fileError,
  } = useMoveFileInProject({
    mutation: {
      onSettled: async (_data, _error, { params: { src_path, dst_file } }) => {
        await invalidateQueries(src_path as string, dst_file as string);
        onSettled && onSettled();
      },
      onSuccess: () => {
        enqueueSnackbar({ message: "File renamed and/or moved", variant: "success" });
      },
      onError: (error) => enqueueError(error),
    },
  });

  const {
    mutate: moveDirectory,
    isPending: directoryPending,
    error: directoryError,
  } = useMovePath({
    mutation: {
      onSettled: async (_data, _error, { params: { src_path } }) => {
        await invalidateQueries(src_path as string);
        onSettled && onSettled();
      },
      onSuccess: () => {
        enqueueSnackbar({ message: "Directory renamed and/or moved", variant: "success" });
      },
      onError: (error) => enqueueError(error),
    },
  });

  // Handlers
  const handleFileMove = (dstPath: string, mutationOptions?: Parameters<typeof moveFile>[1]) => {
    // compute the query parameters for the requests
    // E.g. for a type="file": /path/to/file.txt -> /new/path/to/file.txt
    const fileName = srcPath.split("/").pop() as string; // file.txt
    const srcPathStem = getPathStem(srcPath); // /path/to
    const dstPathStem = getPathStem(dstPath); // /new/path/to
    const dstFile = dstPath.trim().split("/").pop() as string; // file.txt

    moveFile(
      {
        params: {
          project_id: projectId,
          file: fileName,
          src_path: srcPathStem,
          dst_path: dstPathStem,
          dst_file: dstFile,
        },
      },
      mutationOptions,
    );
  };

  const handleDirectoryMove = (
    dstPath: string,
    mutationOptions?: Parameters<typeof moveDirectory>[1],
  ) => {
    moveDirectory(
      {
        params: {
          project_id: projectId,
          dst_path: "/" + dstPath,
          src_path: "/" + srcPath,
        },
      },
      mutationOptions,
    );
  };

  if (type === "directory") {
    return { handleMove: handleDirectoryMove, isPending: directoryPending, error: directoryError };
  }
  return { handleMove: handleFileMove, isPending: filePending, error: fileError };
};
