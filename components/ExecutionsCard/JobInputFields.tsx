import type { FC } from 'react';
import React from 'react';

import { Grid, MenuItem, TextField } from '@material-ui/core';

import type { ProjectId } from '../state/currentProjectHooks';
import { useSelectedFiles } from '../state/FileSelectionContext';

// Define types for the form schema as the Open API spec doesn't define these (just gives string)
// These might be defined in the form generator types?
interface InputFieldSchema {
  title: string;
  type: 'dir' | 'file';
  'mime-types': string[];
  multiple?: true;
}

interface InputSchema {
  required?: string[];
  properties: {
    [key: string]: InputFieldSchema;
  };
}

interface JobInputFieldsProps {
  projectId: ProjectId;
  inputs: InputSchema;
  initialValues?: Record<string, string | string[] | undefined>;
  setInputsData: (inputData: any) => void;
}

export const JobInputFields: FC<JobInputFieldsProps> = ({
  projectId,
  inputs,
  initialValues,
  setInputsData,
}) => {
  const selectedFilesState = useSelectedFiles(projectId); // User selects files and directories from this context

  // selectedFilesState is undefined if no project is selected.
  // This shouldn't happen here but checking just in case.
  if (selectedFilesState) {
    const selectedFiles = ['/', ...selectedFilesState.selectedFiles]; // Manually add root of project option
    return (
      <>
        {Object.entries(inputs.properties).map(
          ([key, { title, type, 'mime-types': mimeType, multiple }]) => {
            return (
              // Expect a grid container in the parent component
              <Grid item key={key} xs={12}>
                <TextField
                  fullWidth
                  select
                  defaultValue={initialValues?.[key] ?? (multiple ? [] : '')}
                  label={title}
                  required={inputs.required?.includes(key)}
                  SelectProps={{ multiple }}
                  onChange={(event) => {
                    setInputsData((prevData: any) => ({ ...prevData, [key]: event.target.value }));
                  }}
                >
                  {Array.from(new Set([initialValues?.[key], ...selectedFiles].flat()))
                    .filter((filePath): filePath is string => filePath !== undefined)
                    .filter(
                      (filePath) =>
                        (type === 'file' && filePath.includes('.')) ||
                        (type === 'dir' && !filePath.includes('.')), // TODO: This is all very crude and should be improved
                    )
                    .map((filePath) => (
                      <MenuItem key={filePath} value={filePath}>
                        {filePath}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            );
          },
        )}
      </>
    );
  }
  // TODO: Can probably remove this and fix the selectedFilesState with a type assertion
  return <div></div>;
};
