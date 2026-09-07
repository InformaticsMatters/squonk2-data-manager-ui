import { type FileRejection } from "react-dropzone";

import { expect, test } from "@playwright/test";

import { fileRejectionMessages } from "../../src/projects/fileRejections";

/** A rejection as react-dropzone delivers it: the file it refused, and why it refused it. */
const rejection = (
  name: string,
  ...errors: { code: string; message: string }[]
): FileRejection => ({ errors, file: new File([], name) });

const tooLarge = { code: "file-too-large", message: "File is larger than 1048576 bytes" };
const wrongType = { code: "file-invalid-type", message: "File type must be chemical/x-mdl-sdfile" };

/** Every rule react-dropzone reports of its own accord, against the words it is shown as. */
const rules: [code: string, rule: string][] = [
  ["file-too-large", "larger than the size this directory accepts"],
  ["file-too-small", "smaller than the size this directory accepts"],
  ["file-invalid-type", "not a file type this directory accepts"],
  ["too-many-files", "too many files were dropped at once"],
];

test.describe("rejected upload", () => {
  test("names the rule a single file broke", () => {
    expect(fileRejectionMessages([rejection("hello.sdf", tooLarge)])).toEqual([
      "hello.sdf was rejected: larger than the size this directory accepts.",
    ]);
  });

  for (const [code, rule] of rules) {
    test(`names the ${code} rule`, () => {
      expect(fileRejectionMessages([rejection("hello.sdf", { code, message: "" })])).toEqual([
        `hello.sdf was rejected: ${rule}.`,
      ]);
    });
  }

  test("names every rule one file broke", () => {
    expect(fileRejectionMessages([rejection("hello.sdf", tooLarge, wrongType)])).toEqual([
      "hello.sdf was rejected: larger than the size this directory accepts; not a file type this directory accepts.",
    ]);
  });

  test("keeps the reason a rule this application does not name gave", () => {
    const custom = { code: "file-name-reserved", message: "A file cannot be named .." };
    expect(fileRejectionMessages([rejection("..", custom)])).toEqual([
      ".. was rejected: A file cannot be named ...",
    ]);
  });

  test("still reports a rejection that accounted for itself with nothing at all", () => {
    expect(fileRejectionMessages([rejection("hello.sdf")])).toEqual(["hello.sdf was rejected."]);
  });

  test("gathers the files that broke the same rule into one sentence", () => {
    const tooMany = { code: "too-many-files", message: "Too many files" };
    expect(
      fileRejectionMessages([rejection("a.sdf", tooMany), rejection("b.sdf", tooMany)]),
    ).toEqual(["a.sdf and b.sdf were rejected: too many files were dropped at once."]);
  });

  test("keeps a rule of its own for each file that broke a different one", () => {
    expect(
      fileRejectionMessages([rejection("a.sdf", tooLarge), rejection("b.png", wrongType)]),
    ).toEqual([
      "a.sdf was rejected: larger than the size this directory accepts.",
      "b.png was rejected: not a file type this directory accepts.",
    ]);
  });

  test("names the files that broke one rule while there are few enough to read", () => {
    const names = ["a.sdf", "b.sdf", "c.sdf"];
    expect(fileRejectionMessages(names.map((name) => rejection(name, tooLarge)))).toEqual([
      "a.sdf, b.sdf and c.sdf were rejected: larger than the size this directory accepts.",
    ]);
  });

  test("counts the files that broke one rule rather than listing every name", () => {
    const names = ["a.sdf", "b.sdf", "c.sdf", "d.sdf", "e.sdf"];
    expect(fileRejectionMessages(names.map((name) => rejection(name, tooLarge)))).toEqual([
      "5 files were rejected: larger than the size this directory accepts.",
    ]);
  });

  test("says nothing when nothing was rejected", () => {
    expect(fileRejectionMessages([])).toEqual([]);
  });
});
