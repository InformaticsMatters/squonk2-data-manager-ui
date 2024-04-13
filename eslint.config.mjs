import config, { ts } from '@squonk/eslint-config';

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const tsParserOptions = {
  parser: ts.parser,
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: "latest",
    sourceType: "module",
  },
};

export default config.map(c => ({ ...c, languageOptions: { ...c.languageOptions, ...tsParserOptions }}));
