import { useCallback, useMemo, useState } from 'react';

import type { GetDatasetsParams, TypeSummary, UserSummary } from '@squonk/data-manager-client';

/**
 * Hook encapsulating the filter state which also calculates the params for useGetDatasets hook.
 */
export const useDatasetsParams = () => {
  const [label, setLabel] = useState<string>('');
  const [user, setUser] = useState<UserSummary | undefined>();
  const [fileType, setFileType] = useState<TypeSummary | undefined>();

  // Filtering according to label uses JSON format, the label state needs to be parsed
  const processLabel = useCallback((lbl: string) => {
    const [key, value] = lbl.split('=');
    const labelObject = {
      [key]: value || null,
    };
    return JSON.stringify(labelObject);
  }, []);

  const datasetsParams: GetDatasetsParams = useMemo(
    () => ({
      dataset_mime_type: fileType?.mime,
      username: user?.username,
      labels: label ? processLabel(label) : undefined,
    }),
    [fileType, user, label, processLabel],
  );

  return { datasetsParams, label, setLabel, user, setUser, fileType, setFileType };
};
