import { useMemo } from 'react';

import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { Typography } from '@material-ui/core';

import { AutocompleteFilter } from './AutocompleteFilter';

export interface FileTypeFilterProps {
  value?: string;
  onChange: (value: string | null) => void;
}

export const FileTypeFilter = (props: FileTypeFilterProps) => {
  const { data, error, isError, isLoading } = useGetFileTypes();

  const fileTypes = useMemo(() => {
    if (data) {
      return data.types.map((type) => type.mime);
    }
    return [];
  }, [data]);

  if (isError) {
    return <Typography color="error">{error?.error}</Typography>;
  }

  return (
    <AutocompleteFilter
      disabled={isLoading}
      id="dataset-file-type-filter"
      label="Filter by file type"
      options={fileTypes}
      {...props}
    />
  );
};
