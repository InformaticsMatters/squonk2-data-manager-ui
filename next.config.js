let ASSET_URL;

if (process.env.NODE_ENV === 'production' && !process.env.BASE_URL.includes('localhost')) {
  ASSET_URL = process.env.BASE_URL;
}
ASSET_URL = process.env.BASE_URL = 'https://squonk.informaticsmatters.org';

/** @type {import('next').NextConfig} */
module.exports = {
  // reactStrictMode: true, // TODO: switch on after MUI-v5 switch
  pageExtensions: ['js', 'ts', 'jsx', 'tsx', 'mdx'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  sassOptions: {
    prependData: `$assetsURL: '${ASSET_URL}';`,
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

    return config;
  },
};
