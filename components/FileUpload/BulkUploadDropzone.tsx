import type { FC } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import { Grid, useTheme } from '@material-ui/core';

import { Dropzone } from '../Uploads/Dropzone';
import type { UploadableFile } from '../Uploads/types';
import { mutateAtPosition } from '../Uploads/utils';
import { SingleFileUploadWithProgress } from './SingleFileUploader';

interface BulkUploadDropzoneProps {
  files: UploadableFile[];
  setFiles: (files: UploadableFile[] | ((files: UploadableFile[]) => UploadableFile[])) => void;
}

export const BulkUploadDropzone: FC<BulkUploadDropzoneProps> = ({ files, setFiles }) => {
  const theme = useTheme();

  const onDelete = (file: File) => {
    setFiles((curr) => curr.filter((fw) => fw.file !== file));
  };

  return (
    <Dropzone files={files} setFiles={setFiles}>
      <Grid container direction="column">
        {files.map((fileWrapper, index) => (
          <Grid
            item
            css={css`
              margin-bottom: ${theme.spacing(1)}px;
            `}
            key={fileWrapper.id}
          >
            <SingleFileUploadWithProgress
              changeMimeType={(newType) => {
                files[index].mimeType = newType;
                setFiles(mutateAtPosition(files, index, files[index]));
              }}
              changeToDone={() => {
                files[index].done = true;
                setFiles(mutateAtPosition(files, index, files[index]));
              }}
              errors={fileWrapper.errors}
              fileWrapper={fileWrapper}
              rename={(newName) => {
                files[index].rename = newName;
                setFiles(mutateAtPosition(files, index, files[index]));
              }}
              onDelete={onDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Dropzone>
  );
};
