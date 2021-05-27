module.exports = {
  basePath: process.env.BASE_PATH,
  sassOptions: {
    prependData: `$assetsURL: '${
      process.env.NODE_ENV === 'development'
        ? 'https://squonk.informaticsmatters.org'
        : process.env.BASE_URL
    }';`,
  },
  future: {
    webpack5: true,
  },
};
