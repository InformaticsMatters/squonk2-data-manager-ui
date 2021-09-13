import type { FC } from 'react';
import React from 'react';

import { Grid, Typography } from '@material-ui/core';

import type { ProjectId } from '../../hooks/currentProjectHooks';
import { FileSelector } from './FileList/FileSelector';
import type { InputData } from './JobModal';

// Define types for the form schema as the Open API spec doesn't define these (just gives string)
// These might be defined in the form generator types?
interface InputFieldSchema {
  title: string;
  type: 'directory' | 'file';
  'mime-types'?: string[];
  multiple?: true;
}

interface InputSchema {
  required?: string[];
  properties: {
    [key: string]: InputFieldSchema;
  };
}

export interface JobInputFieldsProps {
  projectId: NonNullable<ProjectId>;
  inputs: InputSchema;
  initialValues?: InputData;
  inputsData: InputData;
  setInputsData: (inputData: InputData) => void;
}

export const JobInputFields: FC<JobInputFieldsProps> = ({
  projectId,
  inputs,
  initialValues,
  inputsData,
  setInputsData,
}) => {
  return (
    <>
      {Object.entries(inputs.properties).map(
        ([key, { title, type, multiple, 'mime-types': mimeTypes }]) => {
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
                value={initialValues?.[key] || inputsData[key]}
                onSelect={(selection) => setInputsData({ ...inputsData, [key]: selection })}
              />
            </Grid>
          );
        },
      )}
    </>
  );
};
