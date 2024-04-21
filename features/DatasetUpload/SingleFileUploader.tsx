import { useEffect, useRef, useState } from "react";
import { type FileError } from "react-dropzone";

import { getGetDatasetsQueryKey } from "@squonk/data-manager-client/dataset";
import { useGetTask } from "@squonk/data-manager-client/task";

import { Grid, IconButton, LinearProgress, MenuItem, TextField, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { TwiddleIcon } from "../../components/uploads/TwiddleIcon";
import { type UploadableFile } from "../../components/uploads/types";
import { useFileExtensions } from "../../hooks/useFileExtensions";
import { useMimeTypeLookup } from "../../hooks/useMimeTypeLookup";
import { separateFileExtensionFromFileName } from "../../utils/app/files";

export interface SingleFileUploadWithProgressProps {
  fileWrapper: UploadableFile;
  errors: FileError[];
  rename: (newName: string) => void;
  changeMimeType: (newType: string) => void;
  changeToDone: () => void;
  onDelete: (file: File) => void;
}

export const SingleFileUploadWithProgress = ({
  fileWrapper,
  onDelete,
  errors,
  rename,
  changeToDone,
  changeMimeType,
}: SingleFileUploadWithProgressProps) => {
  const queryClient = useQueryClient();
  const fileNameRef = useRef<HTMLInputElement>();
  const fileExtRef = useRef<HTMLInputElement>();

  const composeNewFilePath = () => {
    return `${fileNameRef.current?.value}${fileExtRef.current?.value}`;
  };

  const [stem, extension] = separateFileExtensionFromFileName(fileWrapper.file.name);
  // const typeLabelParts = fileWrapper.file.name.split('.');

  const [interval, setInterval] = useState<number | false>(2000);
  const { data: task, isFetching } = useGetTask(fileWrapper.taskId ?? "", undefined, {
    query: {
      enabled: fileWrapper.taskId !== null,
      // When a task id has been set, we poll the task endpoint to wait for the file to finish
      // processing
      refetchInterval: interval,
    },
  });

  useEffect(() => {
    if (task?.done) {
      setInterval(false);
      void queryClient
        .invalidateQueries({ queryKey: getGetDatasetsQueryKey() })
        .then(() => changeToDone());
    }
  }, [changeToDone, queryClient, task]);

  const { extensions } = useFileExtensions();
  const mimeLookup = useMimeTypeLookup();

  const disabled =
    (!!task && !task.done) ||
    (fileWrapper.progress < 100 && fileWrapper.progress > 0) ||
    isFetching ||
    (fileWrapper.progress === 100 && task === undefined);

  return (
    <>
      <Grid container alignItems="center" spacing={1}>
        <Grid item md={9} sm={8} xs={12}>
          <TextField
            fullWidth
            required
            defaultValue={stem}
            disabled={disabled || task?.done}
            inputRef={fileNameRef}
            placeholder={stem}
            onChange={() => rename(composeNewFilePath())}
            onClick={(event) => event.stopPropagation()}
          />
        </Grid>

        <Grid item md={2} sm={3} sx={{ textAlign: "center" }} xs={8}>
          <TextField
            fullWidth
            select
            defaultValue={extension}
            disabled={disabled || task?.done}
            inputRef={fileExtRef}
            label="Ext"
            onChange={(event) => {
              event.stopPropagation();
              rename(composeNewFilePath());

              changeMimeType(mimeLookup[event.target.value]);
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {extensions.map((fileType) => (
              <MenuItem key={fileType} value={fileType}>
                {fileType}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item md={1} sm={1} sx={{ textAlign: "center" }} xs={4}>
          <IconButton
            disabled={disabled}
            size="small"
            sx={{ color: "success.main" }}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(fileWrapper.file);
            }}
          >
            <TwiddleIcon done={!!task?.done} />
          </IconButton>
        </Grid>
      </Grid>

      {fileWrapper.progress < 100 && fileWrapper.progress > 0 && (
        <LinearProgress value={fileWrapper.progress} variant="determinate" />
      )}

      {(fileWrapper.progress === 100 && task === undefined) ||
      (!!task && !task.done) ||
      isFetching ? (
        <LinearProgress />
      ) : null}

      {errors.map((error, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Typography color="error" key={index}>
          {error.message}
        </Typography>
      ))}
    </>
  );
};
