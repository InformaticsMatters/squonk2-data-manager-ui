import React, { useCallback, useState } from 'react';

import { AxiosError } from 'axios';
import { FileError, FileRejection, useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

import { css } from '@emotion/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  useTheme,
} from '@material-ui/core';
import CloudUploadRoundedIcon from '@material-ui/icons/CloudUploadRounded';
import { customInstance } from '@squonk/data-manager-client';

import { SlideUpTransition } from '../SlideUpTransition';
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
      id: uuidv4(),
      progress: 0,
    }));
    const mappedRejected = rejectedFiles.map((rejection) => ({
      ...rejection,
      id: uuidv4(),
      progress: 0,
    }));
    setFiles((prevFiles) => [...prevFiles, ...mappedAccepted, ...mappedRejected]);
  }, []);

  const onDelete = (file: File) => {
    setFiles((curr) => curr.filter((fw) => fw.file !== file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
            const progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
            const updatedFiles = [...files];
            updatedFiles[index].progress = progress;

            setFiles(updatedFiles);
          },
        });
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
        TransitionComponent={SlideUpTransition}
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
          <div
            {...getRootProps()}
            css={css`
              border: 2px dashed
                ${isDragActive ? theme.palette.primary.main : theme.palette.grey[600]};
              border-radius: 8px;
              padding-left: ${theme.spacing(1)}px;
              padding-right: ${theme.spacing(1)}px;
              max-height: 80vh;
              overflow-y: scroll;
            `}
          >
            <input {...getInputProps()} />
            <button
              css={css`
                cursor: pointer;
                text-align: center;
                border: none;
                background: none;
                display: block;
                width: 100%;
                margin-top: ${theme.spacing(2)}px;
                margin-bottom: ${theme.spacing(2)}px;
                font-size: 1rem;
              `}
            >
              Drag and drop files here, or click to select files
            </button>
            {!!files.length && (
              <Divider
                css={css`
                  margin-top: ${theme.spacing(2)}px;
                  margin-bottom: ${theme.spacing(2)}px;
                `}
              />
            )}
            <Grid container direction="column">
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
          </div>
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
