import { type GetDatasetsParams } from "@/api/data-manager";

import { type DatasetListState } from "./routes";

const encodeLabels = (labels: readonly string[]) =>
  JSON.stringify(
    Object.fromEntries(
      labels.map((label) => {
        const separator = label.indexOf("=");
        return separator === -1
          ? [label, null]
          : [label.slice(0, separator), label.slice(separator + 1)];
      }),
    ),
  );

export const getDatasetListParams = (state: DatasetListState): GetDatasetsParams | undefined => {
  if (!state.mimeType && !state.editor && !state.owner && !state.labels?.length) {
    return undefined;
  }
  return {
    dataset_mime_type: state.mimeType,
    editors: state.editor,
    labels: state.labels?.length ? encodeLabels(state.labels) : undefined,
    username: state.owner,
  };
};
