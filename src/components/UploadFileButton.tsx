import React, { useState } from 'react';

import { DropzoneArea } from 'material-ui-dropzone';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  SlideProps,
} from '@material-ui/core';
import CloudUploadRoundedIcon from '@material-ui/icons/CloudUploadRounded';

import { useDatasets } from '../hooks';
import { useUserProfile } from '../hooks/useUserProfile';
import { PostDatasetArgs, Project } from '../Services/apiTypes';
import DataTierAPI from '../Services/DataTierAPI';
import ConditionalTooltip from './ConditionalTooltip';
import LabelSelector from './LabelSelector';

const extensions = ['.sdf', '.pdb'];

const allowedExtensions = [...extensions, ...extensions.map((e) => e + '.gz')];
const allowedFiles = [...extensions, '.gz']; // Dropzone component doesn't allow double extensions

const mapping: { [key: string]: PostDatasetArgs['datasetName'] } = {
  '.sdf': 'chemical/x-mdl-sdfile',
  '.sdf.gz': 'chemical/x-mdl-sdfile',
  '.pdb': 'chemical/x-pdb',
  '.pdb.gz': 'chemical/x-pdb',
};

interface IProps {
  currentProject: Project | null;
}

/**
 * Button and dialog to upload files to the data-tier.
 * @param currentProject the currently selected project, usually from the CurrentProject context.
 */
const UploadFileButton: React.FC<IProps> = ({ currentProject }) => {
  const { profile, profileLoading } = useUserProfile();
  const { refreshDatasets, datasets } = useDatasets();

  const datasetLabels = datasets.map((dataset) => dataset.labels).flat();
  const [labels, setLabels] = useState<string[]>([]);

  const canUpload =
    (!profileLoading &&
      !!profile?.username &&
      !!currentProject?.editors.includes(profile.username)) ||
    currentProject === null;

  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    files.forEach(async (file) => {
      const name = file.name;

      let MIMEType: string | undefined = undefined;
      allowedExtensions.forEach((ext) => {
        if (name.endsWith(ext)) {
          MIMEType = mapping[ext];
        }
      });

      if (MIMEType === undefined) {
        throw Error('Unsupported data type');
      }

      await DataTierAPI.uploadNewDataset({
        file,
        MIMEType,
        projects: currentProject !== null ? [currentProject.projectId] : undefined,
        labels,
      });
      setLabels([]);
      refreshDatasets();
    });

    setOpen(false);
  };

  return (
    <>
      <ConditionalTooltip condition={canUpload} title="Upload a new file">
        <IconButton disabled={!canUpload} onClick={() => setOpen(true)}>
          <CloudUploadRoundedIcon />
        </IconButton>
      </ConditionalTooltip>
      <Dialog
        TransitionComponent={Transition}
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="file-upload-title"
      >
        <DialogTitle id="file-upload-title">Upload new file</DialogTitle>
        <DialogContent>
          Files will be upload into project: {currentProject?.name}
          <LabelSelector options={datasetLabels} labels={labels} setLabels={setLabels} />
          <DropzoneArea
            maxFileSize={100000000}
            filesLimit={1}
            acceptedFiles={allowedFiles}
            onChange={handleFileChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="default">
            Cancel
          </Button>
          <Button onClick={handleUpload}>Upload</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadFileButton;

const Transition = React.forwardRef((props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
});
