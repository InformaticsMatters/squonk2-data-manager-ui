import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stagingRoot = path.resolve(rootDir, ".openapi-staging");
const configPath = path.resolve(rootDir, "tools/openapi/orval.config.ts");
const morphPath = path.resolve(rootDir, "tools/openapi/morph-query-keys.mts");

type ClientConfig = { input: string; output: string; runtime: string };

const clients = {
  "data-manager": {
    input: path.resolve(rootDir, "openapi/data-manager.yaml"),
    output: path.resolve(rootDir, "src/api/data-manager"),
    runtime: path.resolve(rootDir, "src/api/runtime/data-manager"),
  },
  "account-server": {
    input: path.resolve(rootDir, "openapi/account-server.yaml"),
    output: path.resolve(rootDir, "src/api/account-server"),
    runtime: path.resolve(rootDir, "src/api/runtime/account-server"),
  },
} satisfies Record<string, ClientConfig>;

type ClientName = keyof typeof clients;
type StagedClient = [ClientName, string];
type ReplacedClient = { target: string; backup: string; hadTarget: boolean };

const isClientName = (value: string): value is ClientName => value in clients;

const run = (command: string, args: string[], options: SpawnSyncOptions = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false, ...options });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
};

const writeFacades = async (clientName: ClientName, clientRoot: string) => {
  const generatedRoot = path.resolve(clientRoot, "generated");
  const entries = await readdir(generatedRoot, { withFileTypes: true });
  const tags = entries.filter((entry) => entry.isDirectory() && entry.name !== "api-schemas");

  await writeFile(
    path.resolve(clientRoot, "index.ts"),
    [
      `export type { ErrorType } from "../runtime/${clientName}/axios";`,
      "export {",
      "  AXIOS_INSTANCE,",
      "  customInstance,",
      "  setAuthToken,",
      "  setBaseUrl,",
      `} from "../runtime/${clientName}/axios";`,
      `export { customFetch, getBaseURL, setBaseURL } from "../runtime/${clientName}/fetch";`,
      'export * from "./generated/api-schemas";',
      "",
    ].join("\n"),
  );

  for (const { name: tag } of tags) {
    const facadeRoot = path.resolve(clientRoot, tag);
    await mkdir(facadeRoot, { recursive: true });
    await writeFile(
      path.resolve(facadeRoot, "index.ts"),
      `export * from "../generated/${tag}/${tag}";\n`,
    );
    await writeFile(
      path.resolve(facadeRoot, "fetch.ts"),
      `export * from "../generated/${tag}/${tag}.fetch";\n`,
    );
    await writeFile(
      path.resolve(facadeRoot, "zod.ts"),
      `export * from "../generated/${tag}/${tag}.zod";\n`,
    );
  }
};

const stageClient = async (clientName: ClientName, client: ClientConfig, runRoot: string) => {
  const clientRoot = path.resolve(runRoot, clientName);
  const runtimeRoot = path.resolve(runRoot, "runtime", clientName);

  await mkdir(clientRoot, { recursive: true });
  await mkdir(path.dirname(runtimeRoot), { recursive: true });
  await cp(client.runtime, runtimeRoot, { recursive: true });

  const env = {
    ...process.env,
    OPENAPI_INPUT: client.input,
    OPENAPI_OUTPUT: clientRoot,
    OPENAPI_RUNTIME: runtimeRoot,
  };

  run("pnpm", ["exec", "orval", "--config", configPath], { cwd: rootDir, env });
  run(process.execPath, ["--experimental-strip-types", morphPath], {
    cwd: rootDir,
    env: {
      ...process.env,
      CLIENT_API_NAME: clientName,
      OPENAPI_GENERATED_ROOT: path.resolve(clientRoot, "generated"),
    },
  });
  await writeFacades(clientName, clientRoot);
  run(
    "pnpm",
    [
      "exec",
      "prettier",
      "--ignore-path",
      ".prettierignore",
      "--log-level",
      "warn",
      "--write",
      clientRoot,
    ],
    { cwd: rootDir },
  );

  return clientRoot;
};

const replaceClients = async (stagedClients: StagedClient[], runRoot: string) => {
  const backupRoot = path.resolve(runRoot, "backups");
  const replaced: ReplacedClient[] = [];

  await mkdir(backupRoot, { recursive: true });

  try {
    for (const [clientName, stagedRoot] of stagedClients) {
      const target = clients[clientName].output;
      const backup = path.resolve(backupRoot, clientName);
      const hadTarget = existsSync(target);

      await mkdir(path.dirname(target), { recursive: true });
      if (hadTarget) {
        await rename(target, backup);
      }

      replaced.push({ target, backup, hadTarget });
      await rename(stagedRoot, target);
    }
  } catch (error) {
    for (const { target, backup, hadTarget } of replaced.toReversed()) {
      await rm(target, { recursive: true, force: true });
      if (hadTarget) {
        await rename(backup, target);
      }
    }
    throw error;
  }
};

const requested = process.argv[2] ?? "all";
if (requested !== "all" && !isClientName(requested)) {
  throw new Error(
    `Unknown OpenAPI client '${requested}'. Known clients: ${Object.keys(clients).join(", ")}`,
  );
}
const clientNames: ClientName[] =
  requested === "all" ? (Object.keys(clients) as ClientName[]) : [requested];

for (const clientName of clientNames) {
  if (!existsSync(clients[clientName].input)) {
    throw new Error(
      `OpenAPI input not found for ${clientName}: ${path.relative(rootDir, clients[clientName].input)}`,
    );
  }
  if (!existsSync(clients[clientName].runtime)) {
    throw new Error(
      `Runtime adapter not found for ${clientName}: ${path.relative(rootDir, clients[clientName].runtime)}`,
    );
  }
}

await mkdir(stagingRoot, { recursive: true });
const runRoot = await mkdtemp(path.resolve(stagingRoot, "run-"));

try {
  const stagedClients: StagedClient[] = [];
  for (const clientName of clientNames) {
    stagedClients.push([clientName, await stageClient(clientName, clients[clientName], runRoot)]);
  }
  await replaceClients(stagedClients, runRoot);
  console.log(`Generated ${clientNames.join(" and ")} client source in src/api`);
} finally {
  await rm(runRoot, { recursive: true, force: true });
}
