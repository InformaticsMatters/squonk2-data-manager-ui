import {
  AppApiWorkflowRunBody,
  appApiWorkflowRunBodyAsNameMax,
  appApiWorkflowRunBodyAsNameMin,
} from "@/api/data-manager/workflow/zod";

/**
 * What a Run definition declares its launch needs, and what one launch of it carries. A job and a
 * workflow publish their inputs and options the same way — JSON Schema inside a variables block the
 * generated contract types only as an object — so the rule deciding whether a launch has what it
 * needs is written once here. Written per definition kind it would be two rules, and one kind would
 * withhold a launch the other offered.
 */

/** One input field a definition declares. The generated contract gives the block untyped. */
export interface InputFieldSchema {
  title: string;
  type: "directory" | "file" | "molecules-smi";
  "mime-types"?: string[];
  multiple?: true;
  default?: string;
}

/** The inputs a definition offers and the ones it will not run without. */
export interface InputSchema {
  required?: string[];
  properties: Record<string, InputFieldSchema>;
}

/** What has been entered into a definition's input fields. */
export type InputData = Record<string, string[] | string | undefined>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const namesOf = (value: unknown): string[] =>
  Array.isArray(value) && value.every((name) => typeof name === "string") ? value : [];

/** The inputs, options, and option order one definition declares. */
export type RunDefinitionVariables = {
  inputs?: InputSchema;
  options?: Record<string, unknown>;
  /** The order the options are presented in; empty when the definition states none. */
  optionOrder: string[];
};

/**
 * What one definition declares, read from a variables block the generated contract describes only
 * as an object. Each block is taken only when it is shaped as the form reading it requires — the
 * block itself, not every field inside it, which stays the concern of the field that presents it —
 * so a block shaped otherwise is left out rather than costing the caller the whole definition.
 */
export const readRunDefinitionVariables = (variables: unknown): RunDefinitionVariables => {
  if (!isRecord(variables)) {
    return { inputs: undefined, options: undefined, optionOrder: [] };
  }

  const { inputs, options, order } = variables;

  return {
    // An inputs block declaring no properties describes no field at all, so it is no more usable
    // than an absent one.
    inputs:
      isRecord(inputs) && isRecord(inputs.properties)
        ? {
            properties: inputs.properties as InputSchema["properties"],
            required: namesOf(inputs.required),
          }
        : undefined,
    options: isRecord(options) ? options : undefined,
    optionOrder: isRecord(order) ? namesOf(order.options) : [],
  };
};

/**
 * Whether one entered value is usable. A field states its own error from this and a launch is
 * withheld by it, so a field reporting nothing wrong beside a launch that will not be offered is
 * not a state that can arise.
 */
export const validateInputData = (inputValue: string[] | string | undefined) => {
  if (inputValue === undefined) {
    return false;
  }
  if (Array.isArray(inputValue)) {
    return inputValue.every((value) => value !== "");
  }

  return inputValue.split("\n").every((value) => value !== "");
};

/** Whether anything at all stands in this field, as against a name standing there with nothing. */
const inputHasContent = (value: InputData[string]): boolean =>
  Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";

/**
 * The values a definition's own declared defaults start its fields at. A definition that declares a
 * default for an input it also requires is complete the moment it opens, so what the defaults are
 * is part of deciding whether its launch may be sent — which is why every definition kind reads
 * them the same way rather than one kind honouring them and another withholding a launch over them.
 */
export const declaredInputDefaults = (inputs: InputSchema | undefined): InputData =>
  Object.fromEntries(
    Object.entries(inputs?.properties ?? {})
      .filter(([, field]) => field.default !== undefined)
      .map(([name, field]) => [name, field.default as string]),
  );

/**
 * Whether the definition has everything it will not run without: nothing entered is empty, and each
 * input it requires holds something. A required field emptied after it was filled leaves its name
 * behind with nothing in it, so presence alone would offer a launch the definition cannot run. A
 * definition requiring nothing is offered with nothing entered, an empty form being complete for it.
 */
export const runInputsAreSupplied = (inputs: InputSchema | undefined, inputsData: InputData) =>
  Object.values(inputsData).every((value) => validateInputData(value)) &&
  (inputs?.required ?? []).every((name) => inputHasContent(inputsData[name]));

/**
 * The variables one launch carries: what was entered into the definition's options form and its
 * input fields, and nothing else. What a definition declared is the description of those fields —
 * sending it would have the Data Manager run the definition with its own schema as the values.
 */
export const launchVariables = (
  options: unknown,
  inputsData: InputData,
): Record<string, unknown> => ({ ...(isRecord(options) ? options : {}), ...inputsData });

const nameRequirement = `A workflow name is required. It must be ${appApiWorkflowRunBodyAsNameMin} to ${appApiWorkflowRunBodyAsNameMax} characters of letters, digits, spaces, dots, dashes, or underscores, and must begin and end with a letter or digit.`;

const workflowName = AppApiWorkflowRunBody.shape.as_name;

/**
 * Why the Data Manager would not create a running workflow under this name, if it would not. The
 * generated run body is the authority on the name it accepts, so a launch whose only possible
 * answer is a refusal is explained where it can be corrected rather than sent to earn one.
 */
export const workflowLaunchNameProblem = (name: string): string | undefined =>
  workflowName.safeParse(name).success ? undefined : nameRequirement;

/**
 * The name a launch form opens under. An instance carries what it was run with, and the name it
 * was run under is part of that, so a rerun keeps the name that distinguished it from every other
 * run of the same definition. The definition's own identifier is the default for a fresh launch
 * only — it arrives after the form is drawn, so preferring it would let it overwrite the inherited
 * name every time, which is the one thing a rerun could not survive.
 */
export const launchNameDefault = (
  instanceName: string | undefined,
  definitionName: string | undefined,
): string => {
  // A name of nothing distinguishes no run, so it is no more a name than an absent one.
  if (instanceName !== undefined && instanceName !== "") {
    return instanceName;
  }

  return definitionName ?? "";
};
