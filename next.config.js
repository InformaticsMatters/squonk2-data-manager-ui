const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

if (process.env.MONOREPO) {
  console.log('info  - Running with webpack aliases for monorepo compatibility');
}

const withTM = require('next-transpile-modules')(
  ['@squonk/mui-theme'],
  { debug: false }, // Log which files get transpiled
);

const resolvePackage = (packageName) => path.resolve(__dirname, '.', 'node_modules', packageName);

/**
 * @type {import('next').NextConfig}
 */
let nextConfig = {
  generateBuildId: process.env.GIT_SHA ? () => process.env.GIT_SHA : undefined,
  typescript: { ignoreBuildErrors: process.env.SKIP_CHECKS },
  eslint: { ignoreDuringBuilds: process.env.SKIP_CHECKS },
  // reactStrictMode: true, // TODO: switch on after MUI-v5 switch
  pageExtensions: ['js', 'ts', 'jsx', 'tsx', 'mdx'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  sassOptions: {
    prependData: `$assetsURL: '${
      process.env.ASSET_URL || 'https://squonk.informaticsmatters.org'
    }';`,
  },
  images: {
    domains: ['squonk.informaticsmatters.org'],
  },
  // Allow mdx content and mdx files as pages
  webpack(config, options) {
    if (process.env.MONOREPO) {
      const packages = ['react', '@mui/material', 'react-query'];
      packages.forEach(
        (packageName) => (config.resolve.alias[packageName] = resolvePackage(packageName)),
      );
    }

    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        // The default `babel-loader` used by Next:
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          /** @type {import('@mdx-js/loader').Options} */
          options: {
            providerImportSource: '@mdx-js/react',
          },
        },
      ],
    });

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

nextConfig = process.env.MONOREPO ? withTM(nextConfig) : nextConfig;
nextConfig = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

module.exports = nextConfig;
