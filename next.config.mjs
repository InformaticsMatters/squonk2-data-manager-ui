import nextMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import nextRoutes from "nextjs-routes/config";
import { fileURLToPath } from "node:url";

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
  // Enable production source maps for Sentry error reporting
  productionBrowserSourceMaps: true,
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

  // Hides source maps from generated client bundles
  hideSourceMaps: true,
});

export default nextConfig;
