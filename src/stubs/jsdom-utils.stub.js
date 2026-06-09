// Stub for jsdom internals required by paper.js's Node.js canvas integration.
// paper.js only reaches this code path when the `canvas` npm package is installed;
// since it isn't, this stub is never called at runtime — it only exists so that
// Turbopack/webpack can resolve the import statically without failing the build.
module.exports = {
  implForWrapper: () => ({}),
  wrapperForImpl: () => null,
  isInstance: () => false,
};
