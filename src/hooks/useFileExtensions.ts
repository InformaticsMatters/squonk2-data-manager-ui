import { useGetFileTypes } from "@squonk/data-manager-client/type";

export type Mapping = Record<string, string[]>;

export const useFileExtensions = () => {
  const { data } = useGetFileTypes();
  const types = data?.types;

  const mapping: Record<string, string[] | undefined> = {};

  for (const type of types ?? []) {
    const value = mapping[type.mime];
    mapping[type.mime] =
      value === undefined ? type.file_extensions : [...value, ...type.file_extensions];
  }

  const extensions = Object.values(mapping as Mapping).flat();

  return { extensions, mapping: mapping as Mapping };
};
