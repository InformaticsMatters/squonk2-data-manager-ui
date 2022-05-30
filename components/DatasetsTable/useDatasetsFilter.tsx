import { useCallback, useMemo } from "react";

import type { GetDatasetsParams, TypeSummary, UserSummary } from "@squonk/data-manager-client";

import { useImmer } from "use-immer";

type DatasetsFilter = {
  owner?: UserSummary;
  editor?: UserSummary;
  fileType?: TypeSummary;
  labels?: string[];
};

/**
 * Hook encapsulating the filter state which also calculates the params for useGetDatasets hook.
 */
export const useDatasetsFilter = () => {
  const [filter, setFilter] = useImmer<DatasetsFilter>({});

  const setFilterItem = <K extends keyof DatasetsFilter, V extends DatasetsFilter[K]>(
    key: K,
    value: V,
  ) => {
    setFilter((draft) => {
      draft[key] = value;
    });
  };

  // Filtering according to label uses JSON format, the label state needs to be parsed
  const processLabels = useCallback((labels: string[]) => {
    const labelObject: Record<string, string | null> = {};
    labels.forEach((label) => {
      // In case more `=` were provided, leave them for now
      const [key, ...value] = label.split("=", 1);
      labelObject[key] = value.length ? value.join("=") : null;
    });

    return JSON.stringify(labelObject);
  }, []);

  const params: GetDatasetsParams = useMemo<GetDatasetsParams>(() => {
    const { owner, editor, fileType, labels } = filter;
    return {
      dataset_mime_type: fileType?.mime,
      username: owner?.username,
      labels: labels && labels.length ? processLabels(labels) : undefined,
      editors: editor?.username,
    };
  }, [filter, processLabels]);

  return { params, filter, setFilterItem };
};
