import { forwardRef } from "react";

import { Slide, type SlideProps } from "@mui/material";

/**
 * Slide component by locked to the "up" direction
 */
const SlideUpTransitionComponent = (props: SlideProps, ref: React.Ref<unknown>) => {
  return <Slide direction="up" ref={ref} {...props} />;
};

export const SlideUpTransition = forwardRef(SlideUpTransitionComponent);
