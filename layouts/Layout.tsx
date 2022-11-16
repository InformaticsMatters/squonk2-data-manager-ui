import type { ReactNode } from "react";

import { Box, LinearProgress, NoSsr, useMediaQuery } from "@mui/material";

import { CookiesBanner } from "../components/legal/CookiesBanner";
import { useIsTransitioning } from "../hooks/useIsTransitioning";
import { Footer } from "./Footer";
import Header from "./Header";

export interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isPrint = useMediaQuery("print");
  const isTransitioning = useIsTransitioning(false);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      {!isPrint && <Header />}
      {isTransitioning && <LinearProgress />}
      {/* <Slide appear direction="right" in={!isTransitioning}> */}
      <Box component="main" paddingY={2}>
        {children}
      </Box>
      {/* </Slide> */}
      {!isPrint && <Footer />}
      <NoSsr>{!isPrint && <CookiesBanner />}</NoSsr>
    </Box>
  );
};

export default Layout;
