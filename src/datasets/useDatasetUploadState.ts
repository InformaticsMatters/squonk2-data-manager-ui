import { useEffect } from "react";

import { useGetTask } from "@/api/data-manager/task";

import {
  classifyDatasetUpload,
  datasetUploadPollInterval,
  type DatasetUploadRecord,
  type DatasetUploadState,
  settleDatasetUpload,
} from "./uploadLifecycle";

/**
 * What one upload is doing right now, and the single place its task is polled.
 *
 * Every upload screen asks this rather than watching a task itself, so a new dataset and a new
 * version of an existing one classify, poll, back off, and settle by exactly the same rules: only a
 * file awaiting a task is polled, a status read that may succeed next time keeps polling at a
 * slower interval, and a settled outcome is written back into the record once and never again.
 */
export const useDatasetUploadState = ({
  onSettled,
  record,
  uploadId,
}: {
  /** Called once, when this upload's own task has answered for good. */
  onSettled: (uploadId: string, settled: DatasetUploadRecord) => void;
  record: DatasetUploadRecord;
  /** The identity the settled outcome is reported against: this upload's own, never a position. */
  uploadId: string;
}): DatasetUploadState => {
  const taskId = "taskId" in record ? record.taskId : undefined;
  const { data: task, error } = useGetTask(taskId ?? "", undefined, {
    query: {
      enabled: record.kind === "accepted",
      // The interval is asked of the same classifier the display uses, so a file that is only
      // temporarily unreadable keeps being polled while an uninterpretable answer stops.
      refetchInterval: (query) =>
        datasetUploadPollInterval(
          classifyDatasetUpload({ record, task: query.state.data, taskError: query.state.error }),
        ),
      retry: false,
    },
  });

  const state = classifyDatasetUpload({ record, task, taskError: error });

  useEffect(() => {
    // A record that already carries its outcome is never settled again, which is what keeps this
    // effect from answering its own update.
    if (settleDatasetUpload(record)) {
      return;
    }
    const settled = settleDatasetUpload(state);
    if (settled) {
      onSettled(uploadId, settled);
    }
  }, [onSettled, record, state, uploadId]);

  return state;
};
