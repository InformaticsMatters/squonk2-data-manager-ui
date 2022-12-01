import nextMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import nextTranspileModules from "next-transpile-modules";
import nextRoutes from "nextjs-routes/config";
import path from "node:path";

const withRoutes = nextRoutes({ outDir: "types" });

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: { providerImportSource: "@mdx-js/react", jsxImportSource: "@emotion/react" },
});

if (process.env.MONOREPO) {
  console.log("info  - Running with webpack aliases for monorepo compatibility");
}

const withTM = nextTranspileModules(
  ["@squonk/mui-theme"],
  { debug: false }, // Log which files get transpiled
);

const resolvePackage = (packageName) => path.resolve(__dirname, ".", "node_modules", packageName);

/**
 * @type {import('next').NextConfig}
 */
let nextConfig = {
  output: "standalone",
  generateBuildId: process.env.GIT_SHA ? () => process.env.GIT_SHA : undefined,
  typescript: { ignoreBuildErrors: process.env.SKIP_CHECKS },
  eslint: { ignoreDuringBuilds: process.env.SKIP_CHECKS },
  // reactStrictMode: true, // TODO: Blocked by @rjsf Form using UNSAFE_componentWillReceiveProps
  pageExtensions: ["js", "ts", "jsx", "tsx", "mdx"],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  sassOptions: {
    prependData: `$assetsURL: '${
      process.env.ASSET_URL || "https://squonk.informaticsmatters.org"
    }';`,
  },
  images: {
    domains: ["squonk.informaticsmatters.org"],
  },
  sentry: {
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#use-hidden-source-map
    // Added to remove a console message, this will become the default in v8 so can be remove then
    hideSourceMaps: true,
  },
  // Allow mdx content and mdx files as pages
  webpack(config, options) {
    if (options.isServer) {
      config.externals = ["@tanstack/react-query", ...config.externals];
    }
    if (process.env.MONOREPO) {
      const packages = ["react", "@mui/material", "@tanstack/react-query"];
      packages.forEach(
        (packageName) => (config.resolve.alias[packageName] = resolvePackage(packageName)),
      );
    }

    return config;
  },
};

/**
 * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
 */
const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  environment: process.env.NODE_ENV,
};

nextConfig = withMDX(nextConfig);
nextConfig = withRoutes(nextConfig);
nextConfig = process.env.MONOREPO ? withTM(nextConfig) : nextConfig;
nextConfig = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : (delete nextConfig.sentry, nextConfig); // Need to remove sentry config if not using in order to suppress warning

export default nextConfig;
