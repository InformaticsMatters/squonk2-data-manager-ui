/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  extends: ["@squonk/eslint-config"],
};
