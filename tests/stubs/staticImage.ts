import { createRequire } from "node:module";

/** The shape Next's image loader hands a component for an imported image file. */
const staticImage = { blurWidth: 0, height: 1, src: "", width: 1 };

/**
 * Teaches Node to load an imported image file.
 *
 * Importing an image is a bundler feature. The contract seam loads real source modules in plain
 * Node to read the element tree they build, and the chrome it reads reaches the application logo,
 * so without this Node is handed an SVG and asked to parse it as JavaScript. Registered from the
 * Playwright config, which every worker loads before it loads a test file.
 */
export const registerStaticImageRequire = () => {
  const extensions = createRequire(__filename).extensions as unknown as Record<
    string,
    (module: { exports: unknown }) => void
  >;
  for (const extension of [".svg", ".png", ".jpg", ".webp"]) {
    extensions[extension] = (module) => {
      module.exports = { __esModule: true, default: staticImage };
    };
  }
};
