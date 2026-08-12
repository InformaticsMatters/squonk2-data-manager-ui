import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  declaredInputDefaults,
  launchVariables,
  readRunDefinitionVariables,
  runInputsAreSupplied,
  validateInputData,
  workflowLaunchNameProblem,
} from "../../src/projects/runLaunchForm";

/** A definition's declared inputs, as the Data Manager publishes them. */
const inputsSchema = {
  properties: {
    candidates: { title: "Candidates", type: "file" },
    library: { title: "Library", type: "file" },
  },
  required: ["library"],
};

const optionsSchema = {
  properties: { count: { title: "Count", type: "integer" } },
  type: "object",
};

const nameRequirement =
  "A workflow name is required. It must be 2 to 80 characters of letters, digits, spaces, dots, dashes, or underscores, and must begin and end with a letter or digit.";

test.describe("Declared launch variables", () => {
  test("a definition's inputs, options, and option order are read as it declared them", () => {
    expect(
      readRunDefinitionVariables({
        inputs: inputsSchema,
        options: optionsSchema,
        order: { options: ["count"] },
      }),
    ).toEqual({
      inputs: { properties: inputsSchema.properties, required: ["library"] },
      options: optionsSchema,
      optionOrder: ["count"],
    });
  });

  test("a definition that declares no variables at all is offered without a form", () => {
    // A workflow whose variables block is absent, empty, or not an object at all is still a
    // definition the caller may run; only the fields it would have declared are missing.
    for (const variables of [undefined, null, {}, "variables", []]) {
      expect(readRunDefinitionVariables(variables)).toEqual({
        inputs: undefined,
        options: undefined,
        optionOrder: [],
      });
    }
  });

  test("a part shaped as no form could render is dropped rather than taken", () => {
    // The fields are read straight out of these blocks, so taking one that is shaped differently
    // would throw the whole definition away instead of the one part that could not be presented.
    expect(
      readRunDefinitionVariables({
        inputs: { required: ["library"] },
        options: "options",
        order: { options: "count" },
      }),
    ).toEqual({ inputs: undefined, options: undefined, optionOrder: [] });
  });

  test("required inputs are read only when the definition states them as names", () => {
    expect(
      readRunDefinitionVariables({ inputs: { properties: inputsSchema.properties, required: 7 } })
        .inputs,
    ).toEqual({ properties: inputsSchema.properties, required: [] });
  });
});

test.describe("Whether a launch has what it needs", () => {
  const inputs = readRunDefinitionVariables({ inputs: inputsSchema }).inputs;

  test("an input the definition requires must be given before the launch is offered", () => {
    expect(runInputsAreSupplied(inputs, {})).toBe(false);
    expect(runInputsAreSupplied(inputs, { candidates: "file://candidates.sdf" })).toBe(false);
    expect(runInputsAreSupplied(inputs, { library: "file://library.sdf" })).toBe(true);
  });

  test("nothing entered may be empty, required or not", () => {
    expect(runInputsAreSupplied(inputs, { candidates: "", library: "file://library.sdf" })).toBe(
      false,
    );
    expect(runInputsAreSupplied(inputs, { library: ["file://a.sdf", ""] })).toBe(false);
    expect(runInputsAreSupplied(inputs, { library: "c1ccccc1\n" })).toBe(false);
  });

  test("a required input emptied after it was filled is not a given one", () => {
    // Emptying a field leaves its name behind holding nothing, so presence alone would offer a
    // launch the definition cannot run.
    expect(runInputsAreSupplied(inputs, { library: [] })).toBe(false);
    expect(runInputsAreSupplied(inputs, { library: undefined })).toBe(false);
    // An optional field emptied the same way withholds nothing, because it was never needed.
    expect(runInputsAreSupplied(inputs, { candidates: [], library: "file://library.sdf" })).toBe(
      true,
    );
  });

  test("a definition that requires nothing is offered with nothing entered", () => {
    expect(runInputsAreSupplied(undefined, {})).toBe(true);
    expect(runInputsAreSupplied(readRunDefinitionVariables({}).inputs, {})).toBe(true);
  });

  test("one value is judged the same way wherever it is read", () => {
    // The field states its own error from this and the launch is withheld by it, so a field
    // reporting no error beside a launch that will not be offered is not a state that exists.
    expect(validateInputData(undefined)).toBe(false);
    expect(validateInputData("")).toBe(false);
    expect(validateInputData([])).toBe(true);
    expect(validateInputData(["file://a.sdf"])).toBe(true);
  });
});

test.describe("Defaults a definition declares", () => {
  test("a declared default is what its field starts at, and only a declared one is", () => {
    const declared = readRunDefinitionVariables({
      inputs: {
        properties: {
          candidates: { title: "Candidates", type: "file" },
          library: { default: "file://library.sdf", title: "Library", type: "file" },
        },
        required: ["library"],
      },
    });
    expect(declaredInputDefaults(declared.inputs)).toEqual({ library: "file://library.sdf" });
  });

  test("a definition whose required input carries a default is complete as it opens", () => {
    // Read per definition kind, one kind would honour a default and the other would withhold its
    // launch over the very input the definition had already answered.
    const declared = readRunDefinitionVariables({
      inputs: {
        properties: { library: { default: "file://library.sdf", title: "Library", type: "file" } },
        required: ["library"],
      },
    });
    expect(runInputsAreSupplied(declared.inputs, declaredInputDefaults(declared.inputs))).toBe(
      true,
    );
  });

  test("a definition declaring no defaults starts empty rather than guessed at", () => {
    expect(
      declaredInputDefaults(readRunDefinitionVariables({ inputs: inputsSchema }).inputs),
    ).toEqual({});
    expect(declaredInputDefaults(undefined)).toEqual({});
  });
});

test.describe("What a launch carries", () => {
  test("a launch sends what was entered and nothing the definition declared", () => {
    // The declared blocks describe the fields; sending them would have the Data Manager run the
    // definition with its own schema as the values.
    expect(launchVariables({ count: 3 }, { library: "file://library.sdf" })).toEqual({
      count: 3,
      library: "file://library.sdf",
    });
    expect(launchVariables(undefined, {})).toEqual({});
    expect(launchVariables({ inputs: inputsSchema, options: optionsSchema }, {})).toEqual({
      inputs: inputsSchema,
      options: optionsSchema,
    });
  });

  test("an input answers for its own name over an option of the same name", () => {
    expect(launchVariables({ library: "option" }, { library: "file://library.sdf" })).toEqual({
      library: "file://library.sdf",
    });
  });

  test("options that are not a set of values carry nothing into the launch", () => {
    for (const options of [null, "options", 7]) {
      expect(launchVariables(options, { library: "file://library.sdf" })).toEqual({
        library: "file://library.sdf",
      });
    }
  });
});

test.describe("The name a running workflow is created under", () => {
  test("a name the generated contract accepts is not questioned", () => {
    for (const name of ["Ab", "Acceptance Workflow Definition", "run-1.2_3"]) {
      expect(workflowLaunchNameProblem(name)).toBeUndefined();
    }
  });

  test("a name the Data Manager would refuse is explained before it is sent", () => {
    // The generated body is the authority on this, so a launch that could only be answered with a
    // refusal is explained where it can be corrected instead of being sent to earn one.
    for (const name of ["", "a", "a".repeat(81), "-run", "run/1", "run "]) {
      expect(workflowLaunchNameProblem(name)).toBe(nameRequirement);
    }
  });
});

const source = (file: string) => readFileSync(path.join(process.cwd(), "src", file), "utf8");

test.describe("Launch form ownership", () => {
  test("both definition forms decide a launch by the one rule", () => {
    // A job and a workflow declare their inputs in the same way, so a rule written twice would be
    // two rules: one definition kind would withhold a launch the other offered.
    for (const modal of [
      "components/runCards/JobCard/JobModal.tsx",
      "components/runCards/WorkflowCard/WorkflowModal.tsx",
    ]) {
      expect(source(modal)).toContain("runInputsAreSupplied");
      expect(source(modal)).toContain("readRunDefinitionVariables");
      // A default a definition declares is part of whether its launch may be sent, so a form that
      // did not enter them would withhold a launch over an input already answered.
      expect(source(modal)).toContain("declaredInputDefaults");
    }
  });

  test("no definition form reads its declared variables as the values to run with", () => {
    const workflow = source("components/runCards/WorkflowCard/WorkflowModal.tsx");
    expect(workflow).toContain("launchVariables");
    // Seeding the options form with the definition's own variables block is how the declared
    // schema reaches the launch, so the form starts from what has been entered and nothing else.
    expect(workflow).not.toMatch(/useState\(specVariables\)|useState\(variables\)/u);
  });
});
