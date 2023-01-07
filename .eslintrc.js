require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@next/eslint-plugin-next"],
  extends: [
    "plugin:@next/next/recommended",
    "plugin:@next/next/core-web-vitals",
    "@squonk/eslint-config",
  ],
};
