import { forwardRef } from 'react';

import type { SlideProps } from '@material-ui/core';
import { Slide } from '@material-ui/core';

/**
 * Slide component by locked to the "up" direction
 */
export const SlideUpTransition = forwardRef((props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
});
