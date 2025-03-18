import { useGetProjectFile } from "@squonk/data-manager-client/project";
import { createSDFTransformer } from "@squonk/sdf-parser";

import { useQuery } from "@tanstack/react-query";

import { API_ROUTES } from "../../utils/app/routes";
import { type Field, type Schema } from "./ConfigEditor";

const getSchemaFileNameFromSDFFileName = (fname: string) => fname.slice(0, -4) + ".schema.json";

const getSDFFields = async (project: string, path: string, file: string) => {
  const response = await fetch(API_ROUTES.projectFile(project, path, file, "/api/dm-api"));

  if (!response.ok) {
    throw new Error(`Failed to fetch SDF file: ${response.statusText}`);
  }

  const properties = new Set<string>();
  await response.body
    ?.pipeThrough(new TextDecoderStream())
    .pipeThrough(createSDFTransformer())
    .pipeTo(
      new WritableStream({
        write(record) {
          // Get all field keys from the record and add to Set
          Object.keys(record.properties).forEach((key) => properties.add(key));
        },
      }),
    );

  const fields = [...properties].reduce<Record<string, Field>>((acc, property) => {
    acc[property] = { type: "string", description: "" };
    return acc;
  }, {});

  return fields;
};

const stubSchema = (fields: Record<string, Field> | undefined): Schema | undefined => {
  if (fields) {
    return {
      $schema: "",
      $id: "",
      title: "",
      description: "",
      version: 0,
      type: "object",
      fields,
      required: [],
      labels: {},
    };
  }
};

const useGetSDFSchema = (project: string, path: string, file: string) => {
  const schemaFilename = getSchemaFileNameFromSDFFileName(file);
  const {
    data: schemaFile,
    error,
    isLoading,
  } = useGetProjectFile<any>(
    project,
    { path, file: schemaFilename },
    { query: { retry: 0, enabled: true, refetchOnWindowFocus: false } },
  );

  const {
    data: fields,
    isLoading: isSdfLoading,
    error: sdfError,
  } = useQuery({
    queryKey: ["sdf-fields", project, path, file],
    queryFn: () => getSDFFields(project, path, file),
    enabled: error?.status === 404,
    refetchOnWindowFocus: false,
  });

  const fallbackSchema = stubSchema(fields);

  return {
    schema: schemaFile ?? fallbackSchema,
    isLoading: isLoading || isSdfLoading,
    error: error ?? sdfError,
  };
};

export { useGetSDFSchema };
