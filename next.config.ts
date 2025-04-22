import bundleAnalyze from "@next/bundle-analyzer";
import nextMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import { type NextConfig } from "next";
import nextRoutes from "nextjs-routes/config";
import path from "node:path";
import * as url from "node:url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const withRoutes = nextRoutes({ outDir: "types" });

const withMDX = nextMDX({
  extension: /\.mdx?$/u,
  options: { providerImportSource: "@mdx-js/react", jsxImportSource: "@emotion/react" },
});

const MONOREPO_MODE = process.env.npm_config_MONOREPO;

if (MONOREPO_MODE) {
  console.log("- info Running with webpack aliases for monorepo compatibility");
}

const resolvePackage = (packageName: string) =>
  path.resolve(__dirname, ".", "node_modules", packageName);

/**
 * @type {import('next').NextConfig}
 */
let nextConfig: NextConfig = {
  output: process.env.OUTPUT_TYPE as NextConfig["output"],
  generateBuildId: process.env.GIT_SHA ? () => process.env.GIT_SHA ?? null : undefined,
  typescript: { ignoreBuildErrors: !!process.env.SKIP_CHECKS },
  eslint: { ignoreDuringBuilds: !!process.env.SKIP_CHECKS },
  // reactStrictMode: true, // TODO: Blocked by @rjsf Form using UNSAFE_componentWillReceiveProps
  pageExtensions: ["js", "ts", "jsx", "tsx", "mdx"],
  // replace empty string with undefined
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  transpilePackages: MONOREPO_MODE ? ["@squonk/mui-theme", "@squonk/sdf-parser"] : [],
  // Allow mdx content and mdx files as pages
  webpack(config, options) {
    if (options.isServer) {
      config.externals = ["@tanstack/react-query", ...config.externals];
    }
    if (MONOREPO_MODE) {
      const packages = ["react", "@mui/material", "@tanstack/react-query"];
      packages.forEach(
        (packageName) => (config.resolve.alias[packageName] = resolvePackage(packageName)),
      );
    }

    return config;
  },
};

const withBundleAnalyser = bundleAnalyze({
  enabled: process.env.ANALYZE === "true",
});

nextConfig = withBundleAnalyser(nextConfig);
nextConfig = withMDX(nextConfig);
nextConfig = withRoutes(nextConfig);
nextConfig = withSentryConfig(
  nextConfig,
  {
    // Suppresses source map uploading logs during build
    silent: true,
    org: "informatics-matters",
    project: "data-manager-ui",

    // Automatically delete source maps after uploading them to Sentry
    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },

    // Hides source maps from generated client bundles
    hideSourceMaps: true,
  },
);

export default nextConfig;
