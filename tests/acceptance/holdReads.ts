import { type Page } from "@playwright/test";

/**
 * Holds every request to `url` until the returned release is called, so a read that has been sent
 * and not yet answered is an observable state rather than a race.
 */
export const holdReads = async (page: Page, url: RegExp | string) => {
  const held = Promise.withResolvers<undefined>();
  await page.route(url, async (route) => {
    await held.promise;
    await route.continue();
  });
  return async () => {
    held.resolve(undefined);
    await page.unroute(url);
  };
};
