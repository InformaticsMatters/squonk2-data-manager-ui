module.exports = {
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@next/eslint-plugin-next'],
  extends: [
    '@squonk/eslint-config',
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
  ],
};
