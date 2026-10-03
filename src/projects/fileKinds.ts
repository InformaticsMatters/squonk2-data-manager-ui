import { type ConceptKey } from "../components/iconConcepts";
import { isCompressedFileName } from "./fileViewers";

export type FileKind = Extract<
  ConceptKey,
  | "archiveFile"
  | "file"
  | "imageFile"
  | "molecule"
  | "notebookFile"
  | "structuredFile"
  | "tableFile"
  | "textFile"
>;

const kindsByExtension: Record<string, FileKind> = {
  cif: "molecule",
  mol: "molecule",
  mol2: "molecule",
  pdb: "molecule",
  sd: "molecule",
  sdf: "molecule",
  smi: "molecule",
  smiles: "molecule",
  csv: "tableFile",
  tsv: "tableFile",
  xls: "tableFile",
  xlsx: "tableFile",
  json: "structuredFile",
  xml: "structuredFile",
  yaml: "structuredFile",
  yml: "structuredFile",
  log: "textFile",
  md: "textFile",
  txt: "textFile",
  tar: "archiveFile",
  tgz: "archiveFile",
  zip: "archiveFile",
  gif: "imageFile",
  jpeg: "imageFile",
  jpg: "imageFile",
  png: "imageFile",
  svg: "imageFile",
  webp: "imageFile",
  ipynb: "notebookFile",
};

const extensionOf = (fileName: string) => {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
};

/**
 * The kind of file a name says it is, as the concept its icon is drawn with. A compressed file is
 * the kind it holds, so `poses.sdf.gz` is drawn as a molecule file; one that names nothing more is
 * an archive.
 */
export const fileKindConcept = (fileName: string): FileKind => {
  if (isCompressedFileName(fileName)) {
    const inner = fileName.slice(0, fileName.lastIndexOf("."));
    return kindsByExtension[extensionOf(inner)] ?? "archiveFile";
  }
  return kindsByExtension[extensionOf(fileName)] ?? "file";
};
