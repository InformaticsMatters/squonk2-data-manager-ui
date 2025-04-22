import { type ReactNode } from "react";

import { Box, LinearProgress, NoSsr } from "@mui/material";

import { CookiesBanner } from "../components/legal/CookiesBanner";
import { useIsTransitioning } from "../hooks/useIsTransitioning";
import { Footer } from "./Footer";
import Header from "./Header";

export interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isTransitioning = useIsTransitioning(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      {/* Reserve space for the LinearProgress to avoid layout shift */}
      <Box sx={{ minHeight: 4 }}>
        {!!isTransitioning && <LinearProgress />}
      </Box>
      {/* <Slide appear direction="right" in={!isTransitioning}> */}
      <Box component="main" sx={{ paddingY: 2 }}>
        {children}
      </Box>
      {/* </Slide> */}
      <Footer />
      <NoSsr>
        <CookiesBanner />
      </NoSsr>
    </Box>
  );
};

export default Layout;
