import { useGetTypes } from '@squonk/data-manager-client';

export const useFileExtensions = () => {
  const { data } = useGetTypes();
  const types = data?.types;

  const allowedFileTypes = types?.map((type) => type.file_extensions).flat();

  return allowedFileTypes;
};
