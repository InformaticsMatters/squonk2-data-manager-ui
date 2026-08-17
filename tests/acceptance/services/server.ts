import { type createServer } from "node:http";

import { acceptanceUrls } from "../environment";
import { accountServer } from "./accountServer";
import { controlServer } from "./control";
import { dataManagerServer } from "./dataManager";
import { oidcServer } from "./oidc";

/**
 * Starts the four fixture services the acceptance build runs against. Each service owns its own
 * module; this one only decides which ports they answer on and when they stop.
 */

const listen = (server: ReturnType<typeof createServer>, port: number, name: string) =>
  new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      console.log(`${name} fixture listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

const close = () => {
  oidcServer.close();
  dataManagerServer.close();
  accountServer.close();
  controlServer.close();
};
process.once("SIGINT", close);
process.once("SIGTERM", close);

void Promise.all([
  listen(oidcServer, Number(new URL(acceptanceUrls.oidc).port), "OIDC"),
  listen(dataManagerServer, Number(new URL(acceptanceUrls.dataManager).port), "Data Manager"),
  listen(accountServer, Number(new URL(acceptanceUrls.accountServer).port), "Account Server"),
  listen(controlServer, Number(new URL(acceptanceUrls.control).port), "Control"),
]);
