import { useMemo } from 'react';

import type { TypeSummary } from '@squonk/data-manager-client';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { Typography } from '@material-ui/core';

import { AutocompleteFilter } from './AutocompleteFilter';

export interface FileTypeFilterProps {
  fileType?: TypeSummary;
  setFileType: (fileType?: TypeSummary) => void;
}

export const FileTypeFilter = ({ fileType, setFileType }: FileTypeFilterProps) => {
  const { data, error, isError, isLoading } = useGetFileTypes();

  const fileTypes = useMemo(() => {
    if (data) {
      return data.types;
    }
    return [];
  }, [data]);

  if (isError) {
    return <Typography color="error">{error?.error}</Typography>;
  }

  return (
    <AutocompleteFilter
      disabled={isLoading}
      getOptionLabel={(value: TypeSummary) => value.mime}
      id="datasets-file-type-filter"
      label="Filter by file type"
      options={fileTypes}
      value={fileType}
      onChange={setFileType}
    />
  );
};
