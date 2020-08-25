/**
 * TODO: MOVE TO COMPONENT LIB WHEN REPOS ARE SETUP
 */

import React from 'react';

import { Typography } from '@material-ui/core';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
  }),
);

interface Props {
  open: boolean;
  reason: string;
}

const Loader = ({ open, reason }: Props) => {
  const classes = useStyles();

  return (
    <Backdrop className={classes.backdrop} open={open}>
      <div>
        <Typography gutterBottom variant="h6">
          {reason}
        </Typography>
        <CircularProgress color="inherit" />
      </div>
    </Backdrop>
  );
};

export default Loader;
