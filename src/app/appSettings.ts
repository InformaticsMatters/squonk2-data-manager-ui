// Load settings that need to be defined at runtime rather than build time
import get from 'lodash/get';
import zipObject from 'lodash/zipObject';

const VARS = ['DATA_TIER_SERVER', 'GANALYTICS_ID'];

const fetchConfig = () => {
  try {
    var request = new XMLHttpRequest();
    // Loads the config.json file in the public folder
    // ! Should find a better way to do this
    // TODO: // TODO: make the subpath programmatic
    request.open('GET', './config.json', false); // `false` makes the request synchronous
    request.send(null);
    if (request.status === 200) {
      const config = JSON.parse(request.responseText);
      const env = zipObject(
        VARS,
        VARS.map((v) => get(process.env, `REACT_APP_${v}`)),
      );
      return {
        ...env,
        ...config,
      };
    }
  } catch (error) {
    console.error('No config.json found');
    console.error(error);
    // config.json not found or could not be parsed
  }
};

export default {
  ...fetchConfig(),
};
