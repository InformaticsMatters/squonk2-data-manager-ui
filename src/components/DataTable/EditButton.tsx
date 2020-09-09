import React, { useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  SlideProps,
} from '@material-ui/core';
import EditRoundedIcon from '@material-ui/icons/EditRounded';

import { useDatasets } from '../../hooks';
import { Dataset } from '../../Services/apiTypes';
import DataTierAPI from '../../Services/DataTierAPI';
import LabelSelector from '../LabelSelector';
import EditorButton from './EditorButton';

interface IProps {
  dataset: Dataset;
}

/**
 * Button and dialog to modify a file on the data-tier
 * * Currently, only updates to labels is supported
 * @param dataset the dataset that is going to be edited
 */
const EditButton: React.FC<IProps> = ({
  dataset: { editors, datasetId, name, labels: oldLabels },
}) => {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState(oldLabels);
  const { refreshDatasets } = useDatasets();

  const handleConfirm = async () => {
    setOpen(false);
    await DataTierAPI.replaceLabels(datasetId, labels);
    refreshDatasets();
  };

  const handleCancel = () => {
    setLabels(oldLabels);
    setOpen(false);
  };

  return (
    <>
      <EditorButton
        IconElement={<EditRoundedIcon />}
        editors={editors}
        onClick={() => setOpen(true)}
        title="Edit Details"
      />
      <Dialog
        open={open}
        TransitionComponent={Transition}
        onClose={handleCancel}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle id="alert-dialog-slide-title">
          <b>Editing</b>: {name}
        </DialogTitle>
        <DialogContent>
          <LabelSelector
            helperText="Update labels"
            options={oldLabels}
            labels={labels}
            setLabels={setLabels}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="default">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="secondary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditButton;

const Transition = React.forwardRef((props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
});
