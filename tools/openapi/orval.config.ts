import path from "node:path";
import { defineConfig } from "orval";

const input = process.env.OPENAPI_INPUT;
const outputRoot = process.env.OPENAPI_OUTPUT;
const runtimeRoot = process.env.OPENAPI_RUNTIME;

if (!input || !outputRoot || !runtimeRoot) {
  throw new Error("OPENAPI_INPUT, OPENAPI_OUTPUT, and OPENAPI_RUNTIME must be set");
}

const generatedRoot = path.resolve(outputRoot, "generated");

export default defineConfig({
  zod: {
    input: { target: input, unsafeDisableValidation: true },
    output: { client: "zod", mode: "tags-split", target: generatedRoot, fileExtension: ".zod.ts" },
  },
  // The fetch client is generated but unused: every call site goes through the axios client.
  // Kept commented out rather than deleted so the fetch transport can be brought back cheaply.
  // Re-enabling it also means restoring the fetch facades in tools/openapi/generate-client.ts.
  // fetch: {
  //   input: { target: input, unsafeDisableValidation: true },
  //   output: {
  //     mode: "tags-split",
  //     target: generatedRoot,
  //     schemas: path.resolve(generatedRoot, "api-schemas"),
  //     fileExtension: ".fetch.ts",
  //     client: "react-query",
  //     httpClient: "fetch",
  //     override: {
  //       operationName: (operation) => operation["x-semantic-name"],
  //       mutator: { path: path.resolve(runtimeRoot, "fetch.ts"), name: "customFetch" },
  //       aliasCombinedTypes: false,
  //       query: { useSuspenseQuery: true, useInvalidate: true, shouldSplitQueryKey: true },
  //     },
  //   },
  // },
  axios: {
    input: { target: input, unsafeDisableValidation: true },
    output: {
      mode: "tags-split",
      target: generatedRoot,
      schemas: path.resolve(generatedRoot, "api-schemas"),
      client: "react-query",
      httpClient: "axios",
      override: {
        operationName: (operation) => operation["x-semantic-name"],
        mutator: { path: path.resolve(runtimeRoot, "axios.ts"), name: "customInstance" },
        aliasCombinedTypes: false,
        query: { useSuspenseQuery: true, useInvalidate: true, shouldSplitQueryKey: true },
      },
    },
  },
});
