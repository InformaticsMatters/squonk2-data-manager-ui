const withMDX = require('@next/mdx')({
  extension: /\.(md|mdx)$/,
});

let ASSET_URL;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.BASE_URL) {
    console.warn('warn  - BASE_URL is missing in the environment variables');
  }
  if (!(process.env.BASE_URL ?? '').includes('localhost')) {
    ASSET_URL = process.env.BASE_URL;
  } else {
    ASSET_URL = '.';
  }
}
ASSET_URL = process.env.BASE_URL = 'https://squonk.informaticsmatters.org';

module.exports = withMDX({
  // reactStrictMode: true, // TODO: switch on after MUI-v5 switch
  pageExtensions: ['js', 'ts', 'jsx', 'tsx', 'md', 'mdx'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  sassOptions: {
    prependData: `$assetsURL: '${ASSET_URL}';`,
  },
});
