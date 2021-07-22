import type { FC } from 'react';
import React from 'react';

import { Grid, MenuItem, TextField, Typography } from '@material-ui/core';

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
  // User selects files and directories from this project-specific context
  const { selectedFiles } = useSelectedFiles(projectId);

  if (selectedFiles) {
    return (
      <>
        {Object.entries(inputs.properties).map(([key, { title, type, multiple }]) => {
          // Construct array of all paths from the various sources
          const paths = Array.from(
            new Set(
              [
                type === 'dir' ? '/' : undefined, // Add a root option if the input is for directories
                initialValues?.[key], // Provide option for the default value if that is provided in the instance
                ...selectedFiles.filter((file) => file.type === type).map((file) => file.path), // Get the paths of each selected file or directory
              ].flat(), // Create flat array of all selectable paths
            ),
          ).filter((filePath): filePath is string => filePath !== undefined);

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
                {paths.map((filePath) => (
                  <MenuItem key={filePath} value={filePath}>
                    {filePath}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          );
        })}
      </>
    );
  }
  return <Typography>Please select some files first</Typography>;
};
