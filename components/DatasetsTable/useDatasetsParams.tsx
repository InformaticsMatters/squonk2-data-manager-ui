import { useState } from 'react';

import type { GetDatasetsParams } from '@squonk/data-manager-client';

export const useDatasetsParams = () => {
  const [datasetsParams, setDatasetsParams] = useState<GetDatasetsParams>({});

  const changeDatasetsParam =
    <K extends keyof GetDatasetsParams>(param: K) =>
    <T extends GetDatasetsParams[K]>(value: T | null) => {
      setDatasetsParams((prevState) => ({ ...prevState, [param]: value ? value : undefined }));
    };

  return { datasetsParams, changeDatasetsParam };
};
