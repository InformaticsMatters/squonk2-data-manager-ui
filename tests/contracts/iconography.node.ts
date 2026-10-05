import { expect, test } from "@playwright/test";
import * as lucide from "lucide-react";

import { type ConceptKey, concepts } from "../../src/components/iconConcepts";
import { conceptGlyphs, Molecule } from "../../src/components/icons";

/** The lucide-react export for a `lucide-static` file name: `file-plus-2` is `FilePlus2`. */
const lucideExport = (name: string) =>
  lucide[
    name
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join("") as keyof typeof lucide
  ];

const designed = Object.entries(concepts) as [ConceptKey, (typeof concepts)[ConceptKey]][];

test.describe("the application's icons", () => {
  for (const [key, concept] of designed) {
    if (typeof concept.glyph !== "string") {
      test(`${key} is drawn without an icon, as designed`, () => {
        expect(conceptGlyphs).not.toHaveProperty(key);
      });
      continue;
    }
    const glyph = concept.glyph;
    test(`${key} is drawn with ${glyph}, as designed`, () => {
      const expected = glyph === "molecule" ? Molecule : lucideExport(glyph);
      expect(expected, `lucide-react has no export for ${glyph}`).toBeDefined();
      expect(conceptGlyphs[key as keyof typeof conceptGlyphs]).toBe(expected);
    });
  }

  test("draws no concept the design does not have", () => {
    expect(Object.keys(conceptGlyphs).filter((key) => !(key in concepts))).toEqual([]);
  });
});
