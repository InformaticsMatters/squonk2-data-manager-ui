import { useCallback, useMemo, useState } from 'react';

import type { GetDatasetsParams, TypeSummary, UserSummary } from '@squonk/data-manager-client';

export const useDatasetsParams = () => {
  const [label, setLabel] = useState<string>('');
  const [user, setUser] = useState<UserSummary | undefined>();
  const [fileType, setFileType] = useState<TypeSummary | undefined>();

  const processLabel = useCallback((lbl: string) => {
    const [key, value] = lbl.split('=');
    return `{"${key}":${value ? `"${value}"` : 'null'}}`;
  }, []);

  const datasetsParams: GetDatasetsParams = useMemo(
    () => ({
      dataset_mime_type: fileType ? fileType.mime : undefined,
      username: user ? user.username : undefined,
      labels: label ? processLabel(label) : undefined,
    }),
    [fileType, user, label, processLabel],
  );

  console.log(datasetsParams);

  return { datasetsParams, label, setLabel, user, setUser, fileType, setFileType };
};
