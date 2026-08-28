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

// Every rule shipped by eslint-plugin-react-hooks v7, including the React Compiler
// diagnostics the shared config leaves off. Kept as warnings so the compatibility work
// can be done incrementally; `pnpm lint` still fails on them via --max-warnings=0.
const reactCompilerRules = Object.fromEntries(
  [
    "capitalized-calls",
    "config",
    "error-boundaries",
    "exhaustive-effect-dependencies",
    "fbt",
    "gating",
    "globals",
    "hooks",
    "immutability",
    "incompatible-library",
    "invariant",
    "memo-dependencies",
    "memoized-effect-dependencies",
    "no-deriving-state-in-effects",
    "preserve-manual-memoization",
    "purity",
    "refs",
    "rule-suppression",
    "set-state-in-effect",
    "set-state-in-render",
    "static-components",
    "syntax",
    "todo",
    "unsupported-syntax",
    "use-memo",
    "void-use-memo",
  ].map((rule) => [`react-hooks/${rule}`, "warn"]),
);

const appConfig = config.map((entry) => {
  if (entry.name === "base-rules") {
    return {
      ...entry,
      rules: {
        ...entry.rules,
        "simple-import-sort/imports": ["warn", { groups: importGroups }],
      },
    };
  }

  if (entry.name === "react-rules") {
    return { ...entry, rules: { ...entry.rules, ...reactCompilerRules } };
  }

  return entry;
});

export default [{ ignores: ["**/.next/**", "src/api/*/generated/**"] }, ...appConfig];
