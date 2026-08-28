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
    // The shared config enables only rules-of-hooks and exhaustive-deps, leaving every React
    // Compiler diagnostic off. Turn on whatever else the plugin ships, read from the plugin
    // itself so a version bump neither strands us on a stale list nor resurrects a rule the
    // plugin has since removed — removed rules stay in `rules` but are marked deprecated.
    const { rules } = entry.plugins["react-hooks"];
    const allReactHooksRules = Object.entries(rules)
      .filter(([, rule]) => !rule.meta?.deprecated)
      .map(([name]) => [`react-hooks/${name}`, "warn"]);

    return { ...entry, rules: { ...entry.rules, ...Object.fromEntries(allReactHooksRules) } };
  }

  return entry;
});

export default [{ ignores: ["**/.next/**", "src/api/*/generated/**"] }, ...appConfig];
