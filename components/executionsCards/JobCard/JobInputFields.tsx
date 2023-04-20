import type { Dispatch, ReactNode, SetStateAction } from "react";

import { Grid, Typography } from "@mui/material";

import type { ProjectId } from "../../../hooks/projectHooks";
import { FILE_PROTOCOL } from "../../../utils/app/urls";
import { FileSelector } from "../../FileSelector";
import type { InputData } from "./JobModal";
import { MultipleMoleculeInput } from "./MultipleMoleculeInput";

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
  properties: {
    [key: string]: InputFieldSchema;
  };
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
  initialValues,
  inputsData,
  onChange,
}: JobInputFieldsProps) => {
  return (
    <>
      {Object.entries(inputs.properties).map(
        ([key, { title, type, multiple, "mime-types": mimeTypes }]) => {
          if (type === "file" || type === "directory") {
            return (
              <InputSection key={key} title={title}>
                <FileSelector
                  mimeTypes={mimeTypes}
                  multiple={!!multiple}
                  projectId={projectId}
                  targetType={type}
                  value={inputsData[key] || initialValues?.[key]}
                  onSelect={(selection) => onChange({ ...inputsData, [key]: selection })}
                />
              </InputSection>
            );
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (type === "molecules-smi") {
            // Going to replace the "molecules-smi" type as this is specified by "multiple".
            // For now though, we assume it's always multiple molecules
            multiple = true;

            return (
              <InputSection key={key} title={title}>
                <MultipleMoleculeInput
                  mimeTypes={mimeTypes}
                  projectId={projectId}
                  protocol={FILE_PROTOCOL}
                  reset={() => onChange({ ...inputsData, [key]: undefined })}
                  value={inputsData[key] || initialValues?.[key]}
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
}

export const InputSection = ({ children, title }: InputSectionProps) => {
  return (
    // Expect a grid container in the parent component
    <Grid item xs={12}>
      <Typography component="h4" variant="subtitle1">
        <em>{title}</em>
      </Typography>
      {children}
    </Grid>
  );
};
