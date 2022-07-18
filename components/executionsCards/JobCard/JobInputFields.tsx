import type { Dispatch, SetStateAction } from "react";

import { Grid, Typography } from "@mui/material";

import type { ProjectId } from "../../../hooks/projectHooks";
import { FileSelector } from "../../FileSelector";
import type { InputData } from "./JobModal";

// Define types for the form schema as the Open API spec doesn't define these (just gives string)
// These might be defined in the form generator types?
interface InputFieldSchema {
  title: string;
  type: "directory" | "file";
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
          return (
            // Expect a grid container in the parent component
            <Grid item key={key} xs={12}>
              <Typography component="h4" variant="subtitle1">
                <em>{title}</em>
              </Typography>
              <FileSelector
                mimeTypes={mimeTypes}
                multiple={!!multiple}
                projectId={projectId}
                targetType={type}
                value={inputsData[key] || initialValues?.[key]}
                onSelect={(selection) => onChange({ ...inputsData, [key]: selection })}
              />
            </Grid>
          );
        },
      )}
    </>
  );
};
