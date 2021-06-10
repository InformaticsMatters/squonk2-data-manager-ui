import React, { FC } from 'react';

import { Grid, MenuItem, TextField } from '@material-ui/core';

import { useSelectedFiles } from '../DataTable/FileSelectionContext';

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
  inputs: InputSchema;
  setInputsData: (inputData: any) => void;
}

export const JobInputFields: FC<JobInputFieldsProps> = ({ inputs, setInputsData }) => {
  const selectedFilesState = useSelectedFiles(); // User selects files and directories from this context

  // selectedFilesState is undefined if no project is selected.
  // This shouldn't happen here but checking just in case.
  if (selectedFilesState) {
    const { selectedFiles } = selectedFilesState;
    return (
      <>
        {Object.entries(inputs.properties).map(
          ([key, { title, type, 'mime-types': mimeType, multiple }]) => {
            return (
              // Expect a grid container in the parent component
              <Grid item xs={12} key={key}>
                <TextField
                  required={inputs.required?.includes(key)}
                  SelectProps={{ multiple }}
                  select
                  defaultValue={multiple ? [] : ''}
                  fullWidth
                  label={title}
                  onChange={(event) => {
                    setInputsData((prevData: any) => ({ ...prevData, [key]: event.target.value }));
                  }}
                >
                  {selectedFiles.map((filePath) => (
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
