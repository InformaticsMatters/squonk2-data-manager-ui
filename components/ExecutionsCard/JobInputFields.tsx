import React, { FC } from 'react';

import { Grid, MenuItem, TextField } from '@material-ui/core';

import { useSelectedFiles } from '../DataTable/FileSelectionContext';

interface InputFieldSchema {
  title: string;
  type: 'dir' | 'file';
  'mime-types': string[];
  multiple?: true;
}

interface InputSchema {
  properties: {
    [key: string]: InputFieldSchema;
  };
}

interface JobInputFieldsProps {
  inputs: InputSchema;
}

export const JobInputFields: FC<JobInputFieldsProps> = ({ inputs }) => {
  const selectedFilesState = useSelectedFiles();

  if (selectedFilesState) {
    const { selectedFiles } = selectedFilesState;
    return (
      <>
        {Object.entries(inputs.properties).map(
          ([key, { title, type, 'mime-types': mimeType, multiple }]) => {
            return (
              <Grid item xs={12} key={key}>
                <TextField
                  SelectProps={{ multiple }}
                  select
                  defaultValue={multiple ? [] : ''}
                  fullWidth
                  label={title}
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
  return <div></div>;
};
