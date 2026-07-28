import config from "@squonk/eslint-config";

const importGroups = [
  [
    "^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)",
  ],
  ["^react"],
  [String.raw`^\u0000`],
  ["^(@squonk|@/api)(/.*|$)"],
  [String.raw`^@?\w`],
  [
    String.raw`^\.\.(?!/?$)`,
    String.raw`^\.\./?$`,
    String.raw`^\./(?=.*/)(?!/?$)`,
    String.raw`^\.(?!/?$)`,
    String.raw`^\./?$`,
  ],
  [String.raw`^.+\.s?css$`],
];

const appConfig = config.map((entry) =>
  entry.name === "base-rules"
    ? {
        ...entry,
        rules: {
          ...entry.rules,
          "simple-import-sort/imports": ["warn", { groups: importGroups }],
        },
      }
    : entry,
);

export default [{ ignores: ["**/.next/**", "src/api/*/generated/**"] }, ...appConfig];
