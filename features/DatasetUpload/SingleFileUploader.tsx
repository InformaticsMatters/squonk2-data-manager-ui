import { useRef, useState } from "react";
import type { FileError } from "react-dropzone";

import { getGetDatasetsQueryKey } from "@squonk/data-manager-client/dataset";
import { useGetTask } from "@squonk/data-manager-client/task";

import { Grid, IconButton, LinearProgress, MenuItem, TextField, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { TwiddleIcon } from "../../components/uploads/TwiddleIcon";
import type { UploadableFile } from "../../components/uploads/types";
import { separateFileExtensionFromFileName } from "../../components/uploads/utils";
import { useFileExtensions } from "../../hooks/useFileExtensions";
import { useMimeTypeLookup } from "../../hooks/useMimeTypeLookup";

export interface SingleFileUploadWithProgressProps {
  fileWrapper: UploadableFile;
  errors: FileError[];
  rename: (newName: string) => void;
  changeMimeType: (newType: string) => void;
  changeToDone: () => void;
  onDelete: (file: File) => void;
}

export function SingleFileUploadWithProgress({
  fileWrapper,
  onDelete,
  errors,
  rename,
  changeToDone,
  changeMimeType,
}: SingleFileUploadWithProgressProps) {
  const queryClient = useQueryClient();
  const fileNameRef = useRef<HTMLInputElement>();
  const fileExtRef = useRef<HTMLInputElement>();

  const composeNewFilePath = () => {
    return `${fileNameRef.current?.value}${fileExtRef.current?.value}`;
  };

  const [stem, extension] = separateFileExtensionFromFileName(fileWrapper.file.name);
  // const typeLabelParts = fileWrapper.file.name.split('.');

  const [interval, setInterval] = useState<number | false>(2000);
  const { data: task, isLoading } = useGetTask(fileWrapper.taskId ?? "", undefined, {
    query: {
      // When a task id has been set, we poll the task endpoint to wait for the file to finish
      // processing
      refetchInterval: interval,
      onSuccess: async (task) => {
        if (!isLoading && task.done) {
          setInterval(false);
          await queryClient.invalidateQueries(getGetDatasetsQueryKey());
          changeToDone();
        }
      },
    },
  });

  const { extensions } = useFileExtensions();
  const mimeLookup = useMimeTypeLookup();

  const disabled =
    (task && !task.done) ||
    (fileWrapper.progress < 100 && fileWrapper.progress > 0) ||
    isLoading ||
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

      {(fileWrapper.progress === 100 && task === undefined) || (task && !task.done) || isLoading ? (
        <LinearProgress />
      ) : null}

      {errors.map((error, index) => (
        <Typography color="error" key={index}>
          {error.message}
        </Typography>
      ))}
    </>
  );
}
