import React, { useCallback, useState } from 'react';

import { AxiosError } from 'axios';
import { FileError, FileRejection, useDropzone } from 'react-dropzone';

import { css } from '@emotion/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Slide,
  SlideProps,
  useTheme,
} from '@material-ui/core';
import CloudUploadRoundedIcon from '@material-ui/icons/CloudUploadRounded';
import { customInstance } from '@squonk/data-manager-client';

import { SingleFileUploadWithProgress } from './SingleFileUploader';

const allowedFileTypes = ['.sdf', '.pdb'].map((s) => [s, `${s}.gz`]).flat();

const getMimeType = (fileName: string) => {
  const parts = fileName.split('.');

  if (parts.includes('sdf')) {
    return 'chemical/x-mdl-sdfile';
  } else if (parts.includes('pdb')) {
    return 'chemical/x-pdb';
  }
  return 'text/plain';
};

let currentId = 0;

function getNewId() {
  // we could use a fancier solution instead of a sequential ID
  return ++currentId;
}

export interface UploadableFile {
  id: number;
  file: File;
  errors: FileError[];
  progress: number;
  rename?: string;
}

const mutateAtPosition = <T extends unknown>(arr: T[], idx: number, val: T) => {
  const newArr = [...arr];
  newArr[idx] = val;
  return newArr;
};

export const FileUpload = () => {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  // Array of the user uploaded files with associated errors
  const [files, setFiles] = useState<UploadableFile[]>([]);

  // Combine the validated and unvalidated files into a single array for rendering
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    const mappedAccepted = acceptedFiles.map((file) => ({
      file,
      errors: [],
      id: getNewId(),
      progress: 0,
    }));
    const mappedRejected = rejectedFiles.map((rejection) => ({
      ...rejection,
      id: getNewId(),
      progress: 0,
    }));
    setFiles((prevFiles) => [...prevFiles, ...mappedAccepted, ...mappedRejected]);
  }, []);

  const onDelete = (file: File) => {
    setFiles((curr) => curr.filter((fw) => fw.file !== file));
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: allowedFileTypes,
    maxSize: 25 * 1024 ** 2, // 25 MB - same as the API route limit
  });

  const uploadFiles = () => {
    files.forEach(async ({ file, rename }, index) => {
      const data = {
        dataset_file: file,
        as_filename: rename ?? file.name,
        dataset_type: getMimeType(file.name),
      };

      try {
        await customInstance({
          method: 'POST',
          data,
          url: '/dataset',
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const updatedFiles = [...files];
            updatedFiles[index].progress = progress;

            setFiles(updatedFiles);
          },
        });
        files.splice(index, 1);
        setFiles(files);
      } catch (err) {
        if (err.isAxiosError) {
          const data = (err as AxiosError).response?.data;

          const updatedFiles = [...files];
          updatedFiles[index].errors.push({ message: data.detail, code: status });
          setFiles(updatedFiles);
        }
      }
    });
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <CloudUploadRoundedIcon />
      </IconButton>
      <Dialog
        TransitionComponent={Transition}
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="file-upload-title"
        css={css`
          .MuiDialog-paper {
            width: min(90vw, 700px);
          }
        `}
      >
        <DialogTitle id="file-upload-title">Upload new datasets</DialogTitle>
        <DialogContent>
          <Grid container direction="column">
            <Grid item>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag and drop files here, or click to select files</p>
              </div>
            </Grid>
            {files.map((fileWrapper, index) => (
              <Grid
                item
                key={fileWrapper.id}
                css={css`
                  margin-bottom: ${theme.spacing(1)}px;
                `}
              >
                <SingleFileUploadWithProgress
                  onDelete={onDelete}
                  fileWrapper={fileWrapper}
                  errors={fileWrapper.errors}
                  rename={(newName) => {
                    files[index].rename = newName;
                    setFiles(mutateAtPosition(files, index, files[index]));
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="default">
            Close
          </Button>
          <Button onClick={uploadFiles}>Upload</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const Transition = React.forwardRef((props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
});
