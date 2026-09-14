import { expect, test } from "@playwright/test";

import {
  API_CLIENT_REAUTHENTICATION_KEY,
  claimApiClientReauthentication,
  forgetApiClientReauthentication,
} from "../../src/application/apiClientRecovery";

const storageOf = (values: Map<string, string>) => ({
  getItem: (key: string) => values.get(key) ?? null,
  removeItem: (key: string) => values.delete(key),
  setItem: (key: string, value: string) => values.set(key, value),
});

test.describe("API client re-authentication claim", () => {
  test("lets a session that cannot authorise the clients be recovered once", () => {
    const values = new Map<string, string>();
    const storage = storageOf(values);

    expect(claimApiClientReauthentication(storage)).toBe(true);
    expect([...values.keys()]).toEqual([API_CLIENT_REAUTHENTICATION_KEY]);
  });

  test("refuses a second attempt, so a failed recovery cannot loop", () => {
    const storage = storageOf(new Map<string, string>());

    expect(claimApiClientReauthentication(storage)).toBe(true);
    expect(claimApiClientReauthentication(storage)).toBe(false);
    expect(claimApiClientReauthentication(storage)).toBe(false);
  });

  test("recovers again once a token has been obtained", () => {
    const storage = storageOf(new Map<string, string>());

    expect(claimApiClientReauthentication(storage)).toBe(true);
    forgetApiClientReauthentication(storage);
    expect(claimApiClientReauthentication(storage)).toBe(true);
  });

  test("leaves everything else a tab remembered alone", () => {
    const values = new Map<string, string>([["data-manager-ui-project-creation", "in flight"]]);
    const storage = storageOf(values);

    claimApiClientReauthentication(storage);
    forgetApiClientReauthentication(storage);

    expect([...values]).toEqual([["data-manager-ui-project-creation", "in flight"]]);
  });
});
