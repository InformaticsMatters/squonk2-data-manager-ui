module.exports = {
  basePath: process.env.BASE_PATH,
  sassOptions: {
    prependData: `$assetsURL: '${
      process.env.NODE_ENV === 'development' ? 'https://squonk.informaticsmatters.org' : '.'
    }';`,
  },
  future: {
    webpack5: true,
  },
};
