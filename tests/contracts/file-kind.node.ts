import { expect, test } from "@playwright/test";

import { fileKindConcept } from "../../src/projects/fileKinds";

/** File names against the kind of file each is drawn as. */
const expectations: [fileName: string, concept: ReturnType<typeof fileKindConcept>][] = [
  ["poses.sdf", "molecule"],
  ["poses.sd", "molecule"],
  ["ligand.mol", "molecule"],
  ["ligand.mol2", "molecule"],
  ["hits.smi", "molecule"],
  ["hits.smiles", "molecule"],
  ["receptor.pdb", "molecule"],
  ["structure.cif", "molecule"],
  ["results.csv", "tableFile"],
  ["results.tsv", "tableFile"],
  ["sheet.xlsx", "tableFile"],
  ["options.json", "structuredFile"],
  ["config.yaml", "structuredFile"],
  ["config.yml", "structuredFile"],
  ["record.xml", "structuredFile"],
  ["notes.txt", "textFile"],
  ["job.log", "textFile"],
  ["README.md", "textFile"],
  ["bundle.zip", "archiveFile"],
  ["bundle.tar", "archiveFile"],
  ["bundle.tgz", "archiveFile"],
  ["plot.png", "imageFile"],
  ["photo.jpeg", "imageFile"],
  ["diagram.svg", "imageFile"],
  ["analysis.ipynb", "notebookFile"],
  ["binary", "file"],
  ["unknown.xyzw", "file"],
];

test.describe("file kind", () => {
  for (const [fileName, concept] of expectations) {
    test(`${fileName} is drawn as ${concept}`, () => {
      expect(fileKindConcept(fileName)).toBe(concept);
    });
  }

  test("a compressed file is drawn as the kind it holds", () => {
    expect(fileKindConcept("poses.sdf.gz")).toBe("molecule");
    expect(fileKindConcept("results.csv.gzip")).toBe("tableFile");
  });

  test("a compressed tar is an archive", () => {
    expect(fileKindConcept("bundle.tar.gz")).toBe("archiveFile");
  });

  test("a compressed file of no known kind is an archive", () => {
    expect(fileKindConcept("blob.gz")).toBe("archiveFile");
  });

  test("the extension is matched whatever its case", () => {
    expect(fileKindConcept("POSES.SDF")).toBe("molecule");
  });

  test("a dot-file with no extension is a plain file", () => {
    expect(fileKindConcept(".env")).toBe("file");
  });
});
