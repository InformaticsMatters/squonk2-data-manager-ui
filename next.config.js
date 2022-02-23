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
const nextConfig = {
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
  webpack(config) {
    config.module.rules.push({
      test: /\.mdx$/,
      use: [
        {
          loader: 'xdm/webpack.cjs',
          options: {
            // This line allows a configurable provider to configure transformed components
            providerImportSource: '@mdx-js/react',
            // This line provides compatibility with the emotion css prop jsx pragma
            jsxImportSource: '@emotion/react',
          },
        },
      ],
    });

    if (process.env.MONOREPO) {
      const packages = ['react', '@material-ui/core', 'react-query'];
      packages.forEach(
        (packageName) => (config.resolve.alias[packageName] = resolvePackage(packageName)),
      );
    }

    return config;
  },
};

const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  environment: process.env.NODE_ENV,
};

const moduleExports = process.env.MONOREPO ? withTM(nextConfig) : nextConfig;

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
