import { useGetProjectFile } from "@/api/data-manager/file-and-path";
import { createSDFTransformer } from "@squonk/sdf-parser/web";

import { useQuery } from "@tanstack/react-query";

import { filesystemFile } from "../../projects/fileFacts";
import { projectFileTransportLinks } from "../../projects/routes";
import { type Field, type Schema } from "./ConfigEditor";

/**
 * The schema file the Data Manager holds beside one SDF. It is named after the SDF itself, so a
 * compressed SDF looks for the schema of the file it decompresses to rather than for one named
 * after its compression.
 */
const getSchemaFileNameFromSDFFileName = (fileName: string) =>
  `${fileName.replace(/\.sdf(?:\.gz|\.gzip)?$/u, "")}.schema.json`;

const getSDFFields = async (projectId: string, path: string) => {
  const response = await fetch(projectFileTransportLinks.download(projectId, path));

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

/**
 * The schema describing one SDF file, read beside the file it describes. Both the schema read and
 * the fallback that derives fields from the SDF itself address the file's own project and path, so
 * neither can describe a file of another project.
 */
const useGetSDFSchema = (projectId: string, path: string) => {
  const file = filesystemFile(path);
  const directory = file?.directory ?? "/";
  const schemaFilename = getSchemaFileNameFromSDFFileName(file?.name ?? "");
  const {
    data: schemaFile,
    error,
    isLoading,
  } = useGetProjectFile<any>(
    projectId,
    { path: directory, file: schemaFilename },
    { query: { retry: 0, enabled: true, refetchOnWindowFocus: false } },
  );

  const {
    data: fields,
    isLoading: isSdfLoading,
    error: sdfError,
  } = useQuery({
    queryKey: ["sdf-fields", projectId, path],
    queryFn: () => getSDFFields(projectId, path),
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
