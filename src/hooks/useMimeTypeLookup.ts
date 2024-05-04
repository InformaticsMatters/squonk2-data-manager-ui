import { useMemo } from "react";

import { useGetFileTypes } from "@squonk/data-manager-client/type";

/**
 * Hook that consumes the types endpoint and returns a mapping from a file extension to a mime-type
 * @returns Mapping of file extension to mime-type
 */
export const useMimeTypeLookup = () => {
  const { data } = useGetFileTypes();

  const mimeLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    data?.types.forEach((type) => type.file_extensions.forEach((ext) => (lookup[ext] = type.mime)));

    return lookup;
  }, [data]);

  return mimeLookup;
};
