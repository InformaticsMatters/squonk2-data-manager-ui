let ASSET_URL;

if (process.env.NODE_ENV === 'production' && !process.env.BASE_URL.includes('localhost')) {
  ASSET_URL = process.env.BASE_URL;
}
ASSET_URL = process.env.BASE_URL = 'https://squonk.informaticsmatters.org';

module.exports = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  sassOptions: {
    prependData: `$assetsURL: '${ASSET_URL}';`,
  },
  future: {
    webpack5: true,
  },
};
