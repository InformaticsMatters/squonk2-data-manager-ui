import { useGetTypes } from '@squonk/data-manager-client';

export const useMimeTypeLookup = () => {
  const { data } = useGetTypes();
  const types = data?.types;

  const mimeLookup: { [key: string]: string } = {};

  types?.forEach((type) => type.file_extensions.forEach((ext) => (mimeLookup[ext] = type.mime)));

  return mimeLookup;
};
