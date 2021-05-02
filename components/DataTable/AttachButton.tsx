import React, { useState } from 'react';

import { useQueryClient } from 'react-query';

import { css } from '@emotion/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  MenuItem,
  TextField,
} from '@material-ui/core';
import {
  getGetProjectQueryKey,
  Project,
  Type,
  useAttachFile,
  useGetAvailableProjects,
  useGetTypes,
} from '@squonk/data-manager-client';

import { SlideUpTransition } from '../SlideUpTransition';

export const AttachButton: React.FC<{ datasetId: string }> = ({ datasetId }) => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const mutation = useAttachFile();

  const { data: projectsData, isLoading: isProjectsLoading } = useGetAvailableProjects();
  const projects = (projectsData as Project | undefined)?.projects;

  const { data: typesData, isLoading: isTypesLoading } = useGetTypes();
  const types = (typesData as Type | undefined)?.types;

  const [project, setProject] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [path, setPath] = useState('');

  return (
    <>
      <Button onClick={() => setOpen(true)}>Attach</Button>
      <Dialog
        TransitionComponent={SlideUpTransition}
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="attach-dataset-to-project-title"
        css={css`
          .MuiDialog-paper {
            width: min(90vw, 700px);
          }
        `}
      >
        <DialogTitle id="attach-dataset-to-project-title">Attach to project</DialogTitle>
        <DialogContent>
          <FormControl margin="dense" fullWidth>
            <TextField
              disabled={isProjectsLoading}
              id="select-project"
              label="Project"
              value={project}
              select
              variant="outlined"
              fullWidth
              onChange={(e) => setProject(e.target.value)}
            >
              {projects?.map((project) => (
                <MenuItem key={project.project_id} value={project.project_id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
          <FormControl margin="dense" fullWidth>
            <TextField
              disabled={isTypesLoading}
              helperText="The desired Dataset file type (a MIME type). Whether or not the chosen fileType is supported will depend on the Dataset"
              id="select-type"
              label="File Type"
              value={type}
              select
              variant="outlined"
              fullWidth
              onChange={(e) => setType(e.target.value)}
            >
              {types?.map((type) => (
                <MenuItem key={type.mime} value={type.mime}>
                  {type.mime}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
          <FormControl margin="dense" fullWidth>
            <TextField
              variant="outlined"
              label="Path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              helperText="A path within the Project to add the File, default is the project root ('/'), the mount-point within the application container. "
              InputProps={{
                startAdornment: <InputAdornment position="start">/</InputAdornment>,
              }}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="default">
            Cancel
          </Button>
          <Button
            disabled={isProjectsLoading || isTypesLoading}
            onClick={async () => {
              await mutation.mutateAsync(
                {
                  data: {
                    dataset_id: datasetId,
                    project_id: project,
                    as_type: type,
                    path: `/${path}`,
                  },
                },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries(getGetProjectQueryKey(project));
                    setOpen(false);
                  },
                },
              );
            }}
          >
            Attach
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
