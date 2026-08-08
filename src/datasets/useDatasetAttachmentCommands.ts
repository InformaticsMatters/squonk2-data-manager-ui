import { useRef } from "react";

import { type FilePostBodyBody } from "@/api/data-manager";
import { getGetDatasetsQueryKey } from "@/api/data-manager/dataset";
import { getGetFilesQueryKey, useAttachFile } from "@/api/data-manager/file-and-path";

import { useQueryClient } from "@tanstack/react-query";

import { filesystemRoot } from "../projects/fileFacts";
import { attachmentTaskKey } from "./attachment";
import { type AcceptedDatasetTasks, settleDatasetTask } from "./awaitDatasetTask";

/**
 * The only owner of the dataset attachment command and of the invalidation its success earns.
 *
 * An attachment is accepted long before the file exists, so nothing is refreshed until the task the
 * Data Manager issued has settled. What is then refreshed is named explicitly: the listing of the
 * directory in the target project the version landed in, and the dataset collection that records
 * which projects a version is attached to. Both are the generated key factories, so no aggregate
 * cache identity exists and no listing of a project nobody chose is touched.
 */
export const useDatasetAttachmentCommands = () => {
  const queryClient = useQueryClient();
  const attachFile = useAttachFile();
  const acceptedAttachments = useRef<AcceptedDatasetTasks>(new Map());

  return {
    /**
     * Attaches one dataset version to one project and answers with the task that did it. Work the
     * Data Manager already accepted is never sent twice: a retry after a failure this client could
     * not interpret waits on the task that work already has.
     */
    attach: async (request: FilePostBodyBody): Promise<{ taskId: string }> => {
      const taskId = await settleDatasetTask({
        accepted: acceptedAttachments.current,
        action: "Dataset attachment",
        identity: attachmentTaskKey(request),
        queryClient,
        send: async () => (await attachFile.mutateAsync({ data: request })).task_id,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetFilesQueryKey({
            project_id: request.project_id,
            path: request.path ?? filesystemRoot,
          }),
        }),
        queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() }),
      ]);
      return { taskId };
    },
  };
};
