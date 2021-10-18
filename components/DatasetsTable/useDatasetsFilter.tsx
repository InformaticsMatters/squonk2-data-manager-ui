import { useCallback, useMemo } from 'react';

import type { GetDatasetsParams, TypeSummary, UserSummary } from '@squonk/data-manager-client';

import { useImmer } from 'use-immer';

type DatasetsFilter = {
  owner?: UserSummary;
  editor?: UserSummary;
  fileType?: TypeSummary;
  label: string;
};

/**
 * Hook encapsulating the filter state which also calculates the params for useGetDatasets hook.
 */
export const useDatasetsFilter = () => {
  const [filter, setFilter] = useImmer<DatasetsFilter>({ label: '' });

  const setFilterItem = <K extends keyof DatasetsFilter, V extends DatasetsFilter[K]>(
    key: K,
    value: V,
  ) => {
    setFilter((draft) => {
      draft[key] = value;
    });
  };

  // Filtering according to label uses JSON format, the label state needs to be parsed
  const processLabel = useCallback((lbl: string) => {
    const [key, value] = lbl.split('=');
    const labelObject = {
      [key]: value || null,
    };
    return JSON.stringify(labelObject);
  }, []);

  const params: GetDatasetsParams = useMemo<GetDatasetsParams>(() => {
    const { owner, editor, fileType, label } = filter;
    return {
      dataset_mime_type: fileType?.mime,
      username: owner?.username,
      labels: label ? processLabel(label) : undefined,
      editors: editor?.username,
    };
  }, [filter, processLabel]);

  return { params, filter, setFilterItem };
};
