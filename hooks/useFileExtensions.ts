import { useGetFileTypes } from '@squonk/data-manager-client/type';

export const useFileExtensions = () => {
  const { data } = useGetFileTypes();
  const types = data?.types;

  const allowedFileTypes = types?.map((type) => type.file_extensions).flat();

  return allowedFileTypes;
};
