import { spawn } from "node:child_process";

import { acceptanceEnvironment, acceptanceUrls } from "../../tests/acceptance/environment";

const run = (command: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { env: acceptanceEnvironment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code ?? signal ?? "unknown status"}`));
      }
    });
  });

const main = async () => {
  const forwardedArguments = process.argv.slice(2);
  if (forwardedArguments[0] === "--") {
    forwardedArguments.shift();
  }
  console.log("Deterministic acceptance endpoints", acceptanceUrls);
  await run("pnpm", ["build"]);
  await run("pnpm", [
    "exec",
    "playwright",
    "test",
    "--config=playwright.acceptance.config.ts",
    ...forwardedArguments,
  ]);
};

void main();
