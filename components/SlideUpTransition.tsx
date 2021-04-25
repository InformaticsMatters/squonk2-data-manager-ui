import React from 'react';

import { Slide, SlideProps } from '@material-ui/core';

export const SlideUpTransition = React.forwardRef((props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
});
