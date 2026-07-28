import { resolve } from "node:path";

import { Project, SyntaxKind } from "ts-morph";

const generatedRoot = process.env.OPENAPI_GENERATED_ROOT;
const apiName = process.env.CLIENT_API_NAME;

if (!generatedRoot || !apiName) {
  throw new Error("OPENAPI_GENERATED_ROOT and CLIENT_API_NAME must be set");
}

const project = new Project({ skipAddingFilesFromTsConfig: true });
project.addSourceFilesAtPaths(resolve(generatedRoot, "*/*.ts"));

for (const apiFile of project.getSourceFiles()) {
  for (const variable of apiFile.getVariableStatements()) {
    const declaration = variable.getDeclarations()[0];

    if (!declaration?.getName().endsWith("QueryKey")) {
      continue;
    }

    const array = declaration
      .getLastChildByKind(SyntaxKind.ArrowFunction)
      ?.getFirstDescendantByKind(SyntaxKind.ArrayLiteralExpression);

    array?.insertElement(0, JSON.stringify(apiName));
  }
}

await project.save();
