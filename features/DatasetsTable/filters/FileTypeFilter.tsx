import type { TypeSummary } from "@squonk/data-manager-client";
import { useGetFileTypes } from "@squonk/data-manager-client/type";

import { getErrorMessage } from "../../../utils/next/orvalError";
import { AutocompleteFilter } from "./AutocompleteFilter";

export interface FileTypeFilterProps {
  /**
   * Selected file type.
   */
  fileType?: TypeSummary;
  /**
   * Function to set selected file type.
   */
  setFileType: (fileType?: TypeSummary) => void;
}

/**
 * Component which adjusts filtering of datasets according to file type.
 */
export const FileTypeFilter = ({ fileType, setFileType }: FileTypeFilterProps) => {
  const { data, error, isError, isLoading } = useGetFileTypes();

  const fileTypes = data?.types || [];

  return (
    <AutocompleteFilter
      error={getErrorMessage(error)}
      getOptionLabel={(value: TypeSummary) => value.mime}
      id="datasets-file-type-filter"
      isError={isError}
      isLoading={isLoading}
      label="Filter by file type"
      options={fileTypes}
      value={fileType}
      onChange={setFileType}
    />
  );
};
