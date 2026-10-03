import { expect, test } from "@playwright/test";

import { API_SERVERS_PATH, loadApiServers, readApiServers } from "../../src/application/apiServers";

const publishedImage = {
  // What a published image carries: `next build` ran without the addresses, and the installation
  // supplies them to the running container.
  DATA_MANAGER_API_SERVER: "https://an-installation.example/data-manager-api",
  ACCOUNT_SERVER_API_SERVER: "https://an-installation.example/account-server-api",
  DEPICT_API_SERVER: "https://an-installation.example/depict",
};

test.describe("API server addresses", () => {
  test("reads the addresses the installation gave the running container", () => {
    expect(readApiServers(publishedImage)).toEqual({
      dataManager: "https://an-installation.example/data-manager-api",
      accountServer: "https://an-installation.example/account-server-api",
      depict: "https://an-installation.example/depict",
    });
  });

  test("answers an unconfigured environment with empty addresses, never undefined", () => {
    expect(readApiServers({})).toEqual({ dataManager: "", accountServer: "", depict: "" });
  });

  test("asks the server once, however many callers want the addresses", async () => {
    const asked: string[] = [];
    const fetcher = ((input: string) => {
      asked.push(input);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            dataManager: "https://an-installation.example/data-manager-api",
            accountServer: "https://an-installation.example/account-server-api",
            depict: "https://an-installation.example/depict",
          }),
      } as Response);
    }) as unknown as typeof fetch;

    const [first, second, third] = await Promise.all([
      loadApiServers(fetcher),
      loadApiServers(fetcher),
      loadApiServers(fetcher),
    ]);

    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain(API_SERVERS_PATH);
    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });
});
