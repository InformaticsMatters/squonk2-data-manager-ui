import type { PlaywrightTestConfig } from '@playwright/test';

const { BASE_URL, BASE_PATH = '', TEST_PORT } = process.env;

if (!BASE_URL || !BASE_PATH || !TEST_PORT) {
  throw new Error('Possible missing environment variable: BASE_URL or BASE_PATH or TEST_PORT');
}

const config: PlaywrightTestConfig = {
  globalSetup: require.resolve('./global-setup'),
  webServer: {
    command: `pnpm start -- -p ${TEST_PORT}`,
    port: Number(TEST_PORT),
    timeout: 200 * 1000,
    env: {
      NODE_ENV: 'test',
    },
  },
  use: {
    baseURL: BASE_URL + BASE_PATH,
    storageState: 'storageState.json',
  },
  timeout: 60000,
};

export default config;
