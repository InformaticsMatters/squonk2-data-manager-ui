import nextMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import nextRoutes from "nextjs-routes/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const withRoutes = nextRoutes({ outDir: "types" });

const withMDX = nextMDX({
  extension: /\.mdx?$/u,
  options: { providerImportSource: "@mdx-js/react", jsxImportSource: "@emotion/react" },
});

const isPackageLocal = (packageName) => {
  try {
    const resolved = import.meta.resolve(packageName);
    const resolvedPath = resolved.startsWith("file:") ? fileURLToPath(resolved) : resolved;
    return !resolvedPath.includes(".pnpm");
  } catch (error) {
    console.warn(
      `warn Could not resolve package ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
};

const transpilePackages = ["@squonk/mui-theme", "@squonk/sdf-parser"].filter((pkg) =>
  isPackageLocal(pkg),
);

console.log("Transpiling packages:", transpilePackages);

// paper.js (a dep of ketcher-core) requires jsdom internals in its Node.js canvas
// integration. Since the `canvas` npm package is not installed, this code never
// runs, but bundlers still try to resolve the import statically.
// Turbopack also doesn't honour paper's own `browser` field which maps this to false.
const jsdomUtilsStub = resolve(__dirname, "src/stubs/jsdom-utils.stub.js");

/** @type {import("next").NextConfig} */
let nextConfig = {
  outputFileTracingRoot: __dirname,
  output: /** @type {import("next").NextConfig["output"]} */ (process.env.OUTPUT_TYPE),
  generateBuildId: process.env.GIT_SHA ? () => process.env.GIT_SHA ?? null : undefined,
  typescript: { ignoreBuildErrors: true },
  // reactStrictMode: true, // TODO: Blocked by @rjsf Form using UNSAFE_componentWillReceiveProps
  pageExtensions: ["js", "ts", "jsx", "tsx", "mdx"],
  // replace empty string with undefined
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  transpilePackages,
  // Keep paper out of the SSR bundle entirely; it's only needed client-side via
  // the ssr:false dynamic import in SMILESInput and will be loaded by Node.js
  // natively when required (canvas isn't installed so the jsdom path is never hit).
  serverExternalPackages: ["paper"],
  turbopack: {
    // Turbopack doesn't honour paper's browser field which already maps this to
    // false. Provide the stub explicitly. Path must be relative (not absolute)
    // so Turbopack can resolve it for both server and browser chunks.
    resolveAlias: {
      "jsdom/lib/jsdom/living/generated/utils": "./src/stubs/jsdom-utils.stub.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias["jsdom/lib/jsdom/living/generated/utils"] = jsdomUtilsStub;
    return config;
  },
};

nextConfig = withMDX(nextConfig);
nextConfig = withRoutes(nextConfig);
nextConfig = withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,
  org: "informatics-matters",
  project: "data-manager-ui",

  // Automatically delete source maps after uploading them to Sentry
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});

export default nextConfig;
