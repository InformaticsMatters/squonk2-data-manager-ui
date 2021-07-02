import React, { FC, useState } from 'react';

import { useQueryClient } from 'react-query';

import { css } from '@emotion/react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  MenuItem,
  TextField,
} from '@material-ui/core';
import { DatasetVersionDetail } from '@squonk/data-manager-client';
import { useAttachFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey, useGetProjects } from '@squonk/data-manager-client/project';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { SlideUpTransition } from '../SlideUpTransition';

type SelectableMimeTypes = string | '';

interface AttachButtonProps {
  datasetId: string;
  versions: DatasetVersionDetail[];
  fileName: string;
}

export const AttachButton: FC<AttachButtonProps> = ({ datasetId, fileName, versions }) => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const attachFileMutation = useAttachFile();

  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects();
  const projects = projectsData?.projects;

  const { data: typesData, isLoading: isTypesLoading } = useGetFileTypes();
  const types = typesData?.types;

  const [project, setProject] = useState<string>('');
  const [type, setType] = useState<SelectableMimeTypes>();
  const [path, setPath] = useState('');
  const [version, setVersion] = useState<DatasetVersionDetail['version']>();
  const [isImmutable, setIsImmutable] = useState(false);
  const [isCompress, setIsCompress] = useState(true);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Attach</Button>
      <Dialog
        aria-labelledby="attach-dataset-to-project-title"
        css={css`
          .MuiDialog-paper {
            width: min(90vw, 700px);
          }
        `}
        open={open}
        TransitionComponent={SlideUpTransition}
        onClose={() => setOpen(false)}
      >
        <DialogTitle id="attach-dataset-to-project-title">Attach {fileName} to project</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <TextField
              fullWidth
              select
              disabled={isProjectsLoading}
              id="select-project"
              label="Project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              {projects?.map((project) => (
                <MenuItem key={project.project_id} value={project.project_id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <TextField
              fullWidth
              select
              disabled={isProjectsLoading}
              id="select-version"
              label="Version"
              value={version ?? ''}
              onChange={(e) => setVersion(Number(e.target.value))}
            >
              {versions.map((version) => (
                <MenuItem key={version.version} value={version.version}>
                  {`v${version.version}`}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <TextField
              fullWidth
              select
              disabled={isTypesLoading}
              helperText="The desired Dataset file type (a MIME type). Whether or not the chosen fileType is supported will depend on the Dataset"
              id="select-type"
              label="File Type"
              value={type ?? ''}
              onChange={(e) => setType(e.target.value)}
            >
              {types?.map((type) => (
                <MenuItem key={type.mime} value={type.mime}>
                  {type.mime}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isImmutable}
                  onChange={(event) => setIsImmutable(event.target.checked)}
                  name="immutable"
                />
              }
              label="Immutable"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isCompress}
                  onChange={(event) => setIsCompress(event.target.checked)}
                  name="compress"
                />
              }
              label="Compress"
            />
          </FormGroup>
          <FormControl fullWidth margin="dense">
            <TextField
              helperText="A path within the Project to add the File, default is the project root ('/'), the mount-point within the application container. "
              InputProps={{
                startAdornment: <InputAdornment position="start">/</InputAdornment>,
              }}
              label="Path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button color="default" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={isProjectsLoading || isTypesLoading || !version || !type}
            onClick={async () => {
              version &&
                type &&
                (await attachFileMutation.mutateAsync({
                  data: {
                    dataset_version: version,
                    dataset_id: datasetId,
                    project_id: project,
                    immutable: isImmutable,
                    compress: isCompress,
                    as_type: type,
                    path: `/${path}`,
                  },
                }));
              queryClient.invalidateQueries(getGetProjectQueryKey(project));
              setOpen(false);
            }}
          >
            Attach
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
