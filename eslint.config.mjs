import config from "@squonk/eslint-config";

export default config.map((c) => ({ ...c, ignores: ["**/.next/**"] }));
