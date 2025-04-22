import { type Dispatch, type ReactNode, type SetStateAction, useState } from "react";

import { Grid2 as Grid, Typography } from "@mui/material";

import { type ProjectId } from "../../../hooks/projectHooks";
import { FILE_PROTOCOL, removeFileProtocolFromInputData } from "../../../utils/app/urls";
import { FileSelector } from "../../FileSelector";
import { type InputData } from "./JobModal";
import { MultipleMoleculeInput } from "./MultipleMoleculeInput";

export const validateInputData = (inputValue: string[] | string | undefined) => {
  if (inputValue === undefined) {
    return false; // when does this happen?
  }
  if (Array.isArray(inputValue)) {
    return inputValue.every((v) => v !== "");
  }

  return inputValue.split("\n").every((v) => v !== "");
};

// Define types for the form schema as the Open API spec doesn't define these (just gives string)
// These might be defined in the form generator types?
export interface InputFieldSchema {
  title: string;
  type: "directory" | "file" | "molecules-smi";
  "mime-types"?: string[];
  multiple?: true;
  default?: string;
}

export interface InputSchema {
  required?: string[];
  properties: Record<string, InputFieldSchema>;
}

export interface JobInputFieldsProps {
  /**
   * ID of the project from which files will be given
   */
  projectId: NonNullable<ProjectId>;
  /**
   * The schema describing what fields are generated
   */
  inputs: InputSchema;
  /**
   * Optional object with initial value of the field inputs
   */
  initialValues?: InputData;
  /**
   * Object containing the current values of each input
   */
  inputsData: InputData;
  /**
   * Called when inputs are changed. Use this to update inputs state.
   */
  onChange: Dispatch<SetStateAction<InputData>>;
}

export const JobInputFields = ({
  projectId,
  inputs,
  initialValues: initialInitialValues,
  inputsData,
  onChange,
}: JobInputFieldsProps) => {
  // capture initialValue in state as we need to mutate it
  const [initialValues, setInitialValues] = useState(initialInitialValues);
  return (
    <>
      {Object.entries(inputs.properties).map(
        ([key, { title, type, multiple, "mime-types": mimeTypes }]) => {
          if (type === "file" || type === "directory") {
            const required = inputs.required?.includes(key);
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            const value = inputsData[key] || removeFileProtocolFromInputData(initialValues?.[key]);
            return (
              <InputSection
                error={
                  required && !validateInputData(value) ? "must have required input" : undefined
                }
                key={key}
                required={required}
                title={title}
              >
                <FileSelector
                  mimeTypes={mimeTypes}
                  multiple={!!multiple}
                  projectId={projectId}
                  targetType={type}
                  value={value}
                  onSelect={(selection) => onChange({ ...inputsData, [key]: selection })}
                />
              </InputSection>
            );
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (type === "molecules-smi") {
            // Going to replace the "molecules-smi" type as this is specified by "multiple".
            // For now though, we assume it's always multiple molecules
            // eslint-disable-next-line no-useless-assignment
            multiple = true;

            const required = inputs.required?.includes(key);
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            const value = inputsData[key] || initialValues?.[key];

            return (
              <InputSection
                error={
                  required && !validateInputData(value) ? "must have required input" : undefined
                }
                key={key}
                required={required}
                title={title}
              >
                <MultipleMoleculeInput
                  mimeTypes={mimeTypes}
                  projectId={projectId}
                  protocol={FILE_PROTOCOL}
                  reset={() => {
                    // when using initialValues (from a previous instance) we have to clean this up
                    // too if E.g. the file/smiles radio is changed
                    const updatedInitialValue = { ...initialValues };
                    delete updatedInitialValue[key];
                    setInitialValues(updatedInitialValue);

                    // Then reset current input data
                    onChange({ ...inputsData, [key]: undefined });
                  }}
                  value={value}
                  onFileSelect={(selection) => onChange({ ...inputsData, [key]: selection })}
                  onMoleculesChange={(newValue) =>
                    onChange({ ...inputsData, [key]: newValue.join("\n") })
                  }
                />
              </InputSection>
            );
          }
          return (
            <InputSection key={key} title={title}>
              <Typography>Job specification is using a unknown input type.</Typography>
            </InputSection>
          );
        },
      )}
    </>
  );
};

interface InputSectionProps {
  children: ReactNode;
  title: string;
  required?: boolean;
  error?: string;
}

export const InputSection = ({ children, title, required, error }: InputSectionProps) => {
  return (
    // Expect a grid container in the parent component
    <Grid size={{ xs: 12 }}>
      <Typography
        component="h4"
        sx={{ color: error ? "error.main" : undefined }}
        variant="subtitle1"
      >
        <em>
          {title}
          {!!required && " *"}
        </em>
      </Typography>
      {children}
      <Typography sx={{ color: "error.main" }}>{error}</Typography>
    </Grid>
  );
};
