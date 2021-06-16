import { useGetTypes } from '@squonk/data-manager-client';

/**
 * Hook that consumes the types endpoint and returns a mapping from a file extension to a mime-type
 * @returns Mapping of file extension to mime-type
 */
export const useMimeTypeLookup = () => {
  const { data } = useGetTypes();
  const types = data?.types;

  const mimeLookup: { [key: string]: string } = {};

  types?.forEach((type) => type.file_extensions.forEach((ext) => (mimeLookup[ext] = type.mime)));

  return mimeLookup;
};
