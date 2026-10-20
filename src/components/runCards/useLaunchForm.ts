import { useMemo, useState } from "react";

import { useDraftValue } from "../../hooks/useDraftValue";
import {
  declaredInputDefaults,
  type InputData,
  launchVariables,
  type RunDefinitionVariables,
  runInputsAreSupplied,
} from "../../projects/runLaunchForm";

/**
 * What has been entered into one definition's launch form, and whether its inputs are complete. A
 * job and a workflow are launched through the same fields, so a launch inherited from an earlier
 * run — what a rerun starts from — is taken up here once rather than once per definition kind.
 *
 * @param declared what the definition declares its launch needs
 * @param inherited the variables an earlier run was launched with, which every field starts from
 */
export const useLaunchForm = (
  declared: RunDefinitionVariables,
  inherited: Record<string, unknown> | undefined,
) => {
  // Control for generated options form
  const [optionsFormData, setOptionsFormData] = useState<any>(inherited);

  // The values the definition's own declared defaults start its fields at
  const inputsDefault = useMemo(() => declaredInputDefaults(declared.inputs), [declared]);

  // The defaults arrive with the definition, so the fields start at whatever it last declared.
  const [inputsData, setInputsData] = useDraftValue<InputData>(inputsDefault);

  const inputKeys = Object.keys(declared.inputs?.properties ?? {});
  const inheritedInputs = Object.fromEntries(
    Object.entries(inherited ?? {}).filter(([key]) => inputKeys.includes(key)),
  ) as InputData;

  const inputsSupplied = runInputsAreSupplied(
    declared.inputs,
    Object.keys(inputsData).length > 0 ? inputsData : inheritedInputs,
  );

  return {
    inputsData,
    inputsSupplied,
    optionsFormData,
    setInputsData,
    setOptionsFormData,
    /** The variables one launch of this form carries. */
    variables: () => launchVariables(optionsFormData, inputsData),
  };
};
