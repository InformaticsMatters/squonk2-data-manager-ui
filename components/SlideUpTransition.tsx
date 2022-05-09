import { forwardRef } from 'react';

import type { SlideProps } from '@mui/material';
import { Slide } from '@mui/material';

/**
 * Slide component by locked to the "up" direction
 */
export const SlideUpTransition = forwardRef((props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
});
