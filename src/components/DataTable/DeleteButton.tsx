import React, { useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  SlideProps,
} from '@material-ui/core';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';

import { useDatasets } from '../../hooks';
import { Dataset } from '../../Services/apiTypes';
import DataTierAPI from '../../Services/DataTierAPI';
import EditorButton from './EditorButton';

interface IProps {
  dataset: Dataset;
}

/**
 * Button and dialog to delete a file that the user is an editor of
 * You must be an editor of the dataset!
 * @param dataset the dataset that is going to be edited
 */
const DeleteButton: React.FC<IProps> = ({ dataset: { editors, datasetId, name } }) => {
  const [open, setOpen] = useState(false);
  const { refreshDatasets } = useDatasets();

  const handleConfirm = async () => {
    setOpen(false);
    await DataTierAPI.deleteDataset(datasetId);
    refreshDatasets();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      <EditorButton
        IconElement={<DeleteForeverRoundedIcon />}
        editors={editors}
        onClick={() => setOpen(true)}
        title="Delete"
      />
      <Dialog
        open={open}
        TransitionComponent={Transition}
        onClose={handleCancel}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle id="alert-dialog-slide-title">
          <b>Delete</b>: {name}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            You are about to permanently delete this file from the cloud. This action can't be
            undone. Are you sure you want to do this?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="default">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteButton;

const Transition = React.forwardRef((props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
});
